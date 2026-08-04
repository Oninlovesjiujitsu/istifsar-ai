import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY')!;
const UNSTRUCTURED_API_URL =
  Deno.env.get('UNSTRUCTURED_API_URL') ??
  'https://api.unstructuredapp.io/general/v0/general';

const FAST_MIN_CHARS_PER_PAGE = parseInt(
  Deno.env.get('FAST_MIN_CHARS_PER_PAGE') ?? '100', 10,
);
const FORCE_STRATEGY = Deno.env.get('UNSTRUCTURED_FORCE_STRATEGY') ?? '';

const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

type DocumentRecord = {
  id: string;
  storage_path: string | null;
  transcription_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
};

export async function extractText(
  db: ReturnType<typeof createClient>,
  doc: DocumentRecord,
): Promise<string> {
  if (doc.transcription_path) {
    const { data, error } = await db.storage
      .from('transcriptions')
      .download(doc.transcription_path);
    if (error) throw new Error(`Transcription download failed: ${error.message}`);
    return await data.text();
  }

  if (!doc.storage_path) {
    throw new Error('Document has neither transcription_path nor storage_path.');
  }

  const { data: fileBlob, error: dlErr } = await db.storage
    .from('document-scans')
    .download(doc.storage_path);
  if (dlErr) throw new Error(`Scan download failed: ${dlErr.message}`);

  const isEpub = doc.mime_type === 'application/epub+zip';
  if (!isEpub) {
    try {
      const text = await extractWithGemini(fileBlob, doc.mime_type);
      if (text?.trim()) return text;
    } catch (e) {
      console.warn('[ingest-document] Gemini extraction failed, trying Unstructured.io:', e);
    }
  }

  return extractWithUnstructured(fileBlob, doc.original_filename);
}

async function extractWithGemini(
  fileBlob: Blob,
  mimeType: string | null,
): Promise<string> {
  const bytes = new Uint8Array(await fileBlob.arrayBuffer());
  let base64 = '';
  for (let i = 0; i < bytes.length; i += 32768) {
    base64 += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  base64 = btoa(base64);

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_FLASH_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType ?? 'application/pdf',
                  data: base64,
                },
              },
              {
                text: 'Extract ALL text from this document. Preserve the original structure, paragraphs, and formatting. Return ONLY the extracted text, nothing else. Do not summarize or interpret.',
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 65536,
        },
      }),
      signal: AbortSignal.timeout(45_000),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini extraction error ${res.status}: ${body}`);
  }

  const result = (await res.json()) as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const parts = result.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text).join('');
}

async function extractWithUnstructured(
  fileBlob: Blob,
  originalFilename: string | null,
): Promise<string> {
  if (FORCE_STRATEGY === 'fast' || FORCE_STRATEGY === 'hi_res') {
    console.log(`[ingest-document] Unstructured: using forced strategy="${FORCE_STRATEGY}"`);
    return callUnstructured(fileBlob, originalFilename, FORCE_STRATEGY as 'fast' | 'hi_res');
  }

  const fastText = await callUnstructured(fileBlob, originalFilename, 'fast');

  const estimatedPages = Math.max(1, Math.round(fileBlob.size / 3000));
  const avgCharsPerPage = fastText.length / estimatedPages;

  if (fastText.length > 0 && avgCharsPerPage >= FAST_MIN_CHARS_PER_PAGE) {
    console.log(
      `[ingest-document] Unstructured: strategy="fast" succeeded ` +
      `(${fastText.length} chars, ~${avgCharsPerPage.toFixed(0)} chars/page)`,
    );
    return fastText;
  }

  console.warn(
    `[ingest-document] Unstructured: strategy="fast" yielded only ` +
    `${fastText.length} chars (~${avgCharsPerPage.toFixed(0)} chars/page, ` +
    `threshold=${FAST_MIN_CHARS_PER_PAGE}). Retrying with strategy="hi_res".`,
  );

  const hiResText = await callUnstructured(fileBlob, originalFilename, 'hi_res');

  console.log(
    `[ingest-document] Unstructured: strategy="hi_res" fallback ` +
    `yielded ${hiResText.length} chars`,
  );

  return hiResText;
}

async function callUnstructured(
  fileBlob: Blob,
  originalFilename: string | null,
  strategy: 'fast' | 'hi_res',
): Promise<string> {
  const formData = new FormData();
  formData.append('files', fileBlob, originalFilename ?? 'document');
  formData.append('strategy', strategy);

  const res = await fetch(UNSTRUCTURED_API_URL, {
    method: 'POST',
    headers: { 'unstructured-api-key': UNSTRUCTURED_API_KEY },
    body: formData,
    signal: AbortSignal.timeout(strategy === 'hi_res' ? 120_000 : 45_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unstructured.io error ${res.status} (strategy=${strategy}): ${body}`);
  }

  const elements = (await res.json()) as Array<{ text?: string }>;
  return elements
    .filter((el) => el.text?.trim())
    .map((el) => el.text!.trim())
    .join('\n\n');
}
