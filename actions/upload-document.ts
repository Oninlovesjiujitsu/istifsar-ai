
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { DocumentInsert, UploadDocumentResult } from '@/types/ingestion';
import { isVerifiedHistorian, getUserRole } from '@/lib/ui/role-labels';

const ALLOWED_SCAN_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
]);
const MAX_SCAN_BYTES = 52_428_800;    // 50 MB (matches document-scans bucket)
const MAX_TRANS_BYTES = 10_485_760;  // 10 MB (matches transcriptions bucket)

export async function uploadDocument(
  _prev: UploadDocumentResult | null,
  formData: FormData,
): Promise<UploadDocumentResult> {
  const supabase = await createClient();

  // -- Auth + role check ---------------------------------------------------
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const role = getUserRole(user);
  if (!isVerifiedHistorian(role)) {
    return { success: false, error: 'Verified Historian access required to upload documents.' };
  }

  // -- Field validation ----------------------------------------------------
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

  // -- Generate document ID upfront for consistent storage paths -----------
  const docId = crypto.randomUUID();
  const scanPath = `scans/${user.id}/${docId}`;
  const transPath = `${user.id}/${docId}.txt`;

  // -- Upload scan ---------------------------------------------------------
  const { error: scanError } = await supabase.storage
    .from('document-scans')
    .upload(scanPath, scanFile, { contentType: scanFile.type });

  if (scanError) {
    return { success: false, error: `Scan upload failed: ${scanError.message}` };
  }

  // -- Upload transcription (optional) ------------------------------------
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

  // -- Insert document record (published directly, triggers ingestion) ----
  const payload: DocumentInsert = {
    id: docId,
    title,
    description: (formData.get('description') as string)?.trim() || null,
    document_type: (formData.get('document_type') as string) || null,
    date_of_origin: (formData.get('date_of_origin') as string)?.trim() || null,
    origin_location: (formData.get('origin_location') as string)?.trim() || null,
    language: (formData.get('language') as string)?.trim() || null,
    submitter_id: user.id,
    status: 'published',
    published_at: new Date().toISOString(),
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
    await supabase.storage.from('document-scans').remove([scanPath]).catch(() => { });
    if (transcriptionPath) {
      await supabase.storage.from('transcriptions').remove([transPath]).catch(() => { });
    }
    return { success: false, error: `Submission failed: ${docError.message}` };
  }

  // -- Process tags (create new + link associations) --------------------------
  const rawTags = formData.getAll('tags') as string[];
  if (rawTags.length > 0) {
    const parsed: { id: string; name: string; isNew: boolean }[] = rawTags.map(
      (t) => JSON.parse(t),
    );

    const existingTagIds = parsed.filter((t) => !t.isNew).map((t) => t.id);
    const newTags = parsed.filter((t) => t.isNew);

    // Insert new tags and collect their IDs
    const newTagIds: string[] = [];
    for (const tag of newTags) {
      const slug = tag.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data, error } = await supabase
        .from('tags')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ name: tag.name, slug } as any, { onConflict: 'slug' })
        .select('id')
        .single();

      if (!error && data) newTagIds.push(data.id);
    }

    // Link all tags to the document
    const allTagIds = [...existingTagIds, ...newTagIds];
    if (allTagIds.length > 0) {
      await supabase
        .from('document_tags')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(allTagIds.map((tagId) => ({ document_id: docId, tag_id: tagId })) as any);
    }
  }

  return { success: true, documentId: docId };
}

export async function deleteDocument(
  documentId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  // Cast needed: transcription_path not in generated types yet (added in migration 0006)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc } = await (supabase
    .from('documents')
    .select('id, submitter_id, storage_path, transcription_path') as any)
    .eq('id', documentId)
    .single();

  if (!doc) return { success: false, error: 'Document not found.' };

  const role = getUserRole(user);
  if (doc.submitter_id !== user.id && role !== 'admin') {
    return { success: false, error: 'Not authorized.' };
  }

  // Delete the document row (cascades handle chunks, tags, validations)
  const { error } = await supabase.from('documents').delete().eq('id', documentId);
  if (error) {
    // Citation RESTRICT constraint produces a foreign_key_violation
    if (error.code === '23503') {
      return {
        success: false,
        error: 'This document has been cited in conversations and cannot be deleted.',
      };
    }
    return { success: false, error: error.message };
  }

  // Clean up storage (best-effort after successful row delete)
  if (doc.storage_path) {
    await supabase.storage.from('document-scans').remove([doc.storage_path]).catch(() => {});
  }
  if (doc.transcription_path) {
    await supabase.storage.from('transcriptions').remove([doc.transcription_path]).catch(() => {});
  }

  revalidatePath('/publications');
  return { success: true };
}
