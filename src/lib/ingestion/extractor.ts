
/**
 * Text extraction for the Next.js server-side context.
 * The Edge Function has its own inline version.
 *
 * Priority:
 *   1. Historian transcription (transcription_path) — exact text, no OCR.
 *   2. Unstructured.io API (hi_res strategy) — for raw scans.
 */

import { createAdminClient } from '@/src/lib/supabase/admin';

const UNSTRUCTURED_URL =
  process.env.UNSTRUCTURED_API_URL ??
  'https://api.unstructuredapp.io/general/v0/general';

export type ExtractParams = {
  storagePath: string;
  transcriptionPath: string | null;
  originalFilename: string;
  mimeType: string;
};

/** Extract plain text from a document stored in Supabase Storage. */
export async function extractText(params: ExtractParams): Promise<string> {
  const { storagePath, transcriptionPath, originalFilename, mimeType } = params;
  const admin = createAdminClient();

  // 1. Use historian transcription when available.
  if (transcriptionPath) {
    const { data, error } = await admin.storage
      .from('transcriptions')
      .download(transcriptionPath);
    if (error) throw new Error(`Transcription download failed: ${error.message}`);
    return data.text();
  }

  // 2. Fall back to Unstructured.io on the scan.
  const { data, error } = await admin.storage
    .from('document-scans')
    .download(storagePath);
  if (error) throw new Error(`Scan download failed: ${error.message}`);

  const apiKey = process.env.UNSTRUCTURED_API_KEY;
  if (!apiKey) throw new Error('UNSTRUCTURED_API_KEY is not set.');

  const formData = new FormData();
  formData.append('files', data, originalFilename);
  formData.append('strategy', 'hi_res');

  const res = await fetch(UNSTRUCTURED_URL, {
    method: 'POST',
    headers: { 'unstructured-api-key': apiKey },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unstructured.io error ${res.status}: ${body}`);
  }

  const elements = (await res.json()) as Array<{ text?: string }>;
  return elements
    .filter((el) => el.text?.trim())
    .map((el) => el.text!.trim())
    .join('\n\n');
}
