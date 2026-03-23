
'use server';

import { createClient } from '@/lib/supabase/server';
import type { DocumentInsert, UploadDocumentResult } from '@/types/ingestion';
import { notifyValidators } from '@/lib/email/resend';

const ALLOWED_SCAN_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
]);
const MAX_SCAN_BYTES = 52_428_800;    // 50 MB (matches document-scans bucket)
const MAX_TRANS_BYTES = 10_485_760;  // 10 MB (matches transcriptions bucket)

const TIER_RANK: Record<string, number> = {
  pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
};

export async function uploadDocument(
  _prev: UploadDocumentResult | null,
  formData: FormData,
): Promise<UploadDocumentResult> {
  const supabase = await createClient();

  // ── Auth + tier check ──────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const tier = (user.app_metadata?.tier as string) ?? 'pending';
  if ((TIER_RANK[tier] ?? -1) < TIER_RANK.tier_3) {
    return { success: false, error: 'Contributor access required to upload documents.' };
  }

  // ── Field validation ───────────────────────────────────────────────────────
  const title = (formData.get('title') as string)?.trim();
  if (!title) return { success: false, error: 'Title is required.' };

  const scanFile = formData.get('scan') as File | null;
  if (!scanFile || scanFile.size === 0) {
    return { success: false, error: 'A document scan is required.' };
  }
  if (!ALLOWED_SCAN_TYPES.has(scanFile.type)) {
    return { success: false, error: 'Scan must be a PDF, JPEG, PNG, TIFF, or WEBP file.' };
  }
  if (scanFile.size > MAX_SCAN_BYTES) {
    return { success: false, error: 'Scan file exceeds the 50 MB limit.' };
  }

  const transFile = formData.get('transcription') as File | null;
  const hasTranscription = transFile && transFile.size > 0;
  if (hasTranscription && transFile.size > MAX_TRANS_BYTES) {
    return { success: false, error: 'Transcription file exceeds the 10 MB limit.' };
  }

  // ── Generate document ID upfront for consistent storage paths ─────────────
  const docId = crypto.randomUUID();
  const scanPath = `scans/${user.id}/${docId}`;
  const transPath = `${user.id}/${docId}.txt`;

  // ── Upload scan ────────────────────────────────────────────────────────────
  const { error: scanError } = await supabase.storage
    .from('document-scans')
    .upload(scanPath, scanFile, { contentType: scanFile.type });

  if (scanError) {
    return { success: false, error: `Scan upload failed: ${scanError.message}` };
  }

  // ── Upload transcription (optional) ───────────────────────────────────────
  let transcriptionPath: string | null = null;

  if (hasTranscription) {
    const { error: transError } = await supabase.storage
      .from('transcriptions')
      .upload(transPath, transFile, { contentType: 'text/plain' });

    if (transError) {
      // Clean up the scan before returning the error.
      await supabase.storage.from('document-scans').remove([scanPath]);
      return { success: false, error: `Transcription upload failed: ${transError.message}` };
    }
    transcriptionPath = transPath;
  }

  // ── Insert document record (triggers ingestion webhook) ───────────────────
  const payload: DocumentInsert = {
    id: docId,
    title,
    description: (formData.get('description') as string)?.trim() || null,
    document_type: (formData.get('document_type') as string) || null,
    date_of_origin: (formData.get('date_of_origin') as string)?.trim() || null,
    origin_location: (formData.get('origin_location') as string)?.trim() || null,
    language: (formData.get('language') as string)?.trim() || null,
    submitter_id: user.id,
    storage_path: scanPath,
    transcription_path: transcriptionPath,
    original_filename: scanFile.name,
    file_size_bytes: scanFile.size,
    mime_type: scanFile.type,
    page_count: null,
  };

  const { error: docError } = await supabase
    .from('documents')
    // Cast required until types are regenerated after migration 0006.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(payload as any)
    .select('id')
    .single();

  if (docError) {
    // Best-effort cleanup of orphaned storage objects.
    await supabase.storage.from('document-scans').remove([scanPath]).catch(() => {});
    if (transcriptionPath) {
      await supabase.storage.from('transcriptions').remove([transPath]).catch(() => {});
    }
    return { success: false, error: `Submission failed: ${docError.message}` };
  }

  // Notify Tier 1 validators (non-blocking — email failure does not affect the upload)
  notifyValidators(docId, title).catch(() => {});

  return { success: true, documentId: docId };
}
