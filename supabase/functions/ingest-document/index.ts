
/**
 * ingest-document — Supabase Edge Function
 *
 * Triggered by a DB webhook on documents INSERT (see migration 0006).
 * Orchestrates: extract → chunk → embed → store document_chunks.
 *
 * Environment variables (set in Supabase function secrets):
 *   SUPABASE_URL              — injected automatically by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase runtime
 *   GEMINI_API_KEY            — Google AI API key
 *   UNSTRUCTURED_API_KEY      — Unstructured.io API key
 *   UNSTRUCTURED_API_URL      — optional; defaults to hosted API
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY')!;
const UNSTRUCTURED_API_URL =
  Deno.env.get('UNSTRUCTURED_API_URL') ??
  'https://api.unstructuredapp.io/general/v0/general';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
const EMBED_BATCH = 100;  // Gemini batchEmbedContents limit
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Semantic chunking config
const SEMANTIC_BREAKPOINT_THRESHOLD = 75;  // percentile
const SEMANTIC_MAX_CHUNK_TOKENS = 1500;
const SEMANTIC_MIN_CHUNK_TOKENS = 50;
const MAX_SENTENCES_FOR_SEMANTIC = 2000;

// Recursive fallback config
const CHUNK_SIZE = 600;   // tokens
const CHUNK_OVERLAP = 100; // tokens

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentRecord = {
  id: string;
  storage_path: string | null;
  transcription_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
};

type WebhookPayload = {
  type: 'INSERT';
  table: string;
  /** The trigger (0010) only sends { id } — the full record must be fetched from the DB. */
  record: { id: string };
};

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Always return 200 so Supabase doesn't retry the webhook.
  // Failure state is persisted in ingestion_status.
  try {
    const payload: WebhookPayload = await req.json();
    const docId = payload.record?.id;

    if (!docId) {
      console.error('[ingest-document] Missing document id in payload');
      return ok({ error: 'Missing document id' });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // The pg_net trigger (0010) only sends { id } — fetch the full record.
    const { data: doc, error: fetchErr } = await db
      .from('documents')
      .select('id, storage_path, transcription_path, original_filename, mime_type')
      .eq('id', docId)
      .single();

    if (fetchErr || !doc) {
      console.error('[ingest-document] Failed to fetch document:', fetchErr?.message);
      return ok({ error: `Document not found: ${docId}` });
    }

    await setStatus(db, doc.id, 'processing');

    try {
      const text = await extractText(db, doc);

      if (!text?.trim()) {
        await setStatus(db, doc.id, 'failed', 'No text could be extracted.');
        return ok({ error: 'No text extracted' });
      }

      // Semantic chunking: segment → embed sentences → detect breakpoints → assemble
      const semanticChunks = await chunkDocumentSemantic(text);
      const chunkContents = semanticChunks.map((c) => c.content);

      // Re-embed assembled chunks for high-fidelity storage vectors
      const vectors = await embedBatch(chunkContents);

      // Delete any prior chunks (handles re-ingestion).
      await db.from('document_chunks').delete().eq('document_id', doc.id);

      // Insert in batches of 100 to stay within PostgREST limits.
      for (let i = 0; i < semanticChunks.length; i += 100) {
        const batch = semanticChunks.slice(i, i + 100).map((chunk, j) => ({
          document_id: doc.id,
          chunk_index: i + j,
          content: chunk.content,
          token_count: chunk.tokenCount,
          page_number: null,
          // halfvec expects '[v1,v2,...]' string — PostgREST casts it.
          embedding: `[${vectors[i + j].join(',')}]`,
        }));

        const { error } = await db.from('document_chunks').insert(batch);
        if (error) throw new Error(`Chunk insert failed: ${error.message}`);
      }

      await setStatus(db, doc.id, 'done');

      // Auto-tag — disabled for now; re-enable when ready
      // try {
      //   await autoTag(db, doc.id, text);
      // } catch (e) {
      //   console.warn('[ingest-document] Auto-tagging failed:', e);
      // }

      return ok({ chunks: semanticChunks.length, method: 'semantic' });
    } catch (inner) {
      const msg = inner instanceof Error ? inner.message : String(inner);
      console.error('[ingest-document] Pipeline error:', msg);
      await setStatus(db, doc.id, 'failed', msg);
      return ok({ error: msg });
    }
  } catch (outer) {
    console.error('[ingest-document] Handler error:', outer);
    return ok({ error: String(outer) });
  }
});

// ─── Status helper ────────────────────────────────────────────────────────────

async function setStatus(
  db: ReturnType<typeof createClient>,
  docId: string,
  status: 'processing' | 'done' | 'failed',
  errorMsg?: string,
) {
  await db
    .from('documents')
    .update({
      ingestion_status: status,
      ingestion_error: errorMsg ?? null,
    })
    .eq('id', docId);
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Text extraction ──────────────────────────────────────────────────────────

async function extractText(
  db: ReturnType<typeof createClient>,
  doc: DocumentRecord,
): Promise<string> {
  // 1. Prefer historian-provided transcription (instant, no API call).
  if (doc.transcription_path) {
    const { data, error } = await db.storage
      .from('transcriptions')
      .download(doc.transcription_path);
    if (error) throw new Error(`Transcription download failed: ${error.message}`);
    return data.text();
  }

  if (!doc.storage_path) {
    throw new Error('Document has neither transcription_path nor storage_path.');
  }

  // Download the file once — reused by both extraction methods.
  const { data: fileBlob, error: dlErr } = await db.storage
    .from('document-scans')
    .download(doc.storage_path);
  if (dlErr) throw new Error(`Scan download failed: ${dlErr.message}`);

  // 2. Primary: Gemini multimodal extraction (fast, works for text PDFs).
  try {
    const text = await extractWithGemini(fileBlob, doc.mime_type);
    if (text?.trim()) return text;
  } catch (e) {
    console.warn('[ingest-document] Gemini extraction failed, trying Unstructured.io:', e);
  }

  // 3. Fallback: Unstructured.io with 'fast' strategy (for scanned/image docs).
  return extractWithUnstructured(fileBlob, doc.original_filename);
}

/**
 * Extract text from a PDF/image using Gemini's multimodal capabilities.
 * Sends the file as inline base64 data — works for files up to ~20 MB.
 */
async function extractWithGemini(
  fileBlob: Blob,
  mimeType: string | null,
): Promise<string> {
  const bytes = new Uint8Array(await fileBlob.arrayBuffer());
  let base64 = '';
  // Encode in 32 KB slices to avoid stack overflow on large files.
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
      signal: AbortSignal.timeout(45_000), // 45s — leaves headroom within Edge Function 60s limit
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini extraction error ${res.status}: ${body}`);
  }

  const result = (await res.json()) as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/**
 * Fallback: extract text via Unstructured.io using 'fast' strategy.
 */
async function extractWithUnstructured(
  fileBlob: Blob,
  originalFilename: string | null,
): Promise<string> {
  const formData = new FormData();
  formData.append('files', fileBlob, originalFilename ?? 'document');
  formData.append('strategy', 'fast');

  const res = await fetch(UNSTRUCTURED_API_URL, {
    method: 'POST',
    headers: { 'unstructured-api-key': UNSTRUCTURED_API_KEY },
    body: formData,
    signal: AbortSignal.timeout(45_000), // 45s — leaves headroom within Edge Function 60s limit
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

// ─── Chunking — Semantic (primary) + Recursive (fallback) ─────────────────────

type SemanticChunk = {
  content: string;
  tokenCount: number;
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Segment text into sentences using regex-based boundary detection. */
function segmentSentences(text: string): string[] {
  const sentences: string[] = [];
  const raw = text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+(?=[A-Z\u0600-\u06FF\u0400-\u04FF])|\n{2,}/);

  for (const segment of raw) {
    const trimmed = segment.trim();
    if (trimmed) sentences.push(trimmed);
  }
  return sentences;
}

/** Cosine similarity between two vectors. */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Detect breakpoint indices where similarity drops below the percentile threshold. */
function detectBreakpoints(similarities: number[], threshold: number): number[] {
  if (similarities.length === 0) return [];

  const sorted = [...similarities].sort((a, b) => a - b);
  const cutoffIdx = Math.floor((threshold / 100) * (sorted.length - 1));
  const cutoff = sorted[cutoffIdx];

  const breakpoints: number[] = [];
  for (let i = 0; i < similarities.length; i++) {
    if (similarities[i] < cutoff) {
      breakpoints.push(i);
    }
  }
  return breakpoints;
}

/** Group sentences into chunks based on breakpoint indices. */
function assembleChunks(sentences: string[], breakpoints: number[]): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  const bpSet = new Set(breakpoints);

  let start = 0;
  for (let i = 0; i < sentences.length; i++) {
    if (bpSet.has(i) || i === sentences.length - 1) {
      const content = sentences.slice(start, i + 1).join(' ').trim();
      if (content) {
        chunks.push({ content, tokenCount: estimateTokens(content) });
      }
      start = i + 1;
    }
  }

  if (start < sentences.length) {
    const content = sentences.slice(start).join(' ').trim();
    if (content) {
      chunks.push({ content, tokenCount: estimateTokens(content) });
    }
  }

  return chunks;
}

/** Enforce chunk size guardrails: split oversized, merge undersized. */
function enforceGuardrails(
  chunks: SemanticChunk[],
  maxTokens: number,
  minTokens: number,
): SemanticChunk[] {
  // Phase 1: Split oversized chunks using recursive fallback
  const split: SemanticChunk[] = [];
  for (const chunk of chunks) {
    if (chunk.tokenCount > maxTokens) {
      const subChunks = chunkDocumentRecursive(chunk.content, maxTokens, CHUNK_OVERLAP);
      split.push(...subChunks.map((content) => ({
        content,
        tokenCount: estimateTokens(content),
      })));
    } else {
      split.push(chunk);
    }
  }

  // Phase 2: Merge undersized chunks with the next neighbor
  const merged: SemanticChunk[] = [];
  let buffer = '';

  for (const chunk of split) {
    buffer = buffer ? buffer + ' ' + chunk.content : chunk.content;

    if (estimateTokens(buffer) >= minTokens) {
      merged.push({ content: buffer, tokenCount: estimateTokens(buffer) });
      buffer = '';
    }
  }

  if (buffer.trim()) {
    if (merged.length > 0) {
      const last = merged[merged.length - 1];
      last.content += ' ' + buffer.trim();
      last.tokenCount = estimateTokens(last.content);
    } else {
      merged.push({ content: buffer.trim(), tokenCount: estimateTokens(buffer.trim()) });
    }
  }

  return merged;
}

/**
 * Primary chunking: semantic chunking using embedding similarity.
 * Falls back to recursive splitting for documents exceeding the sentence limit.
 */
async function chunkDocumentSemantic(text: string): Promise<SemanticChunk[]> {
  const sentences = segmentSentences(text);

  // Too few sentences — return the whole text as one chunk
  if (sentences.length <= 2) {
    const content = text.trim();
    if (!content) return [];
    return [{ content, tokenCount: estimateTokens(content) }];
  }

  // Too many sentences — fall back to recursive splitter
  if (sentences.length > MAX_SENTENCES_FOR_SEMANTIC) {
    console.warn(
      `[ingest-document] ${sentences.length} sentences exceeds limit of ${MAX_SENTENCES_FOR_SEMANTIC}, falling back to recursive splitter`,
    );
    return chunkDocumentRecursive(text, CHUNK_SIZE, CHUNK_OVERLAP).map((content) => ({
      content,
      tokenCount: estimateTokens(content),
    }));
  }

  // Embed all sentences (for breakpoint detection only)
  const sentenceEmbeddings = await embedBatch(sentences);

  // Compute cosine similarity between consecutive pairs
  const similarities: number[] = [];
  for (let i = 0; i < sentenceEmbeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(sentenceEmbeddings[i], sentenceEmbeddings[i + 1]));
  }

  // Detect breakpoints and assemble chunks
  const breakpoints = detectBreakpoints(similarities, SEMANTIC_BREAKPOINT_THRESHOLD);
  const rawChunks = assembleChunks(sentences, breakpoints);

  // Enforce size guardrails
  return enforceGuardrails(rawChunks, SEMANTIC_MAX_CHUNK_TOKENS, SEMANTIC_MIN_CHUNK_TOKENS);
}

// ─── Recursive character splitter (fallback) ─────────────────────────────────

function mergeRecursiveSplits(
  splits: string[],
  sep: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const chunks: string[] = [];
  const cur: string[] = [];
  let total = 0;
  const sepTok = estimateTokens(sep);

  const flush = () => {
    if (!cur.length) return;
    const doc = cur.join(sep);
    if (doc.trim()) chunks.push(doc);
    while (cur.length > 0) {
      const headTok = estimateTokens(cur[0]) + (cur.length > 1 ? sepTok : 0);
      if (total - headTok < overlap) break;
      total -= headTok;
      cur.shift();
    }
  };

  for (const s of splits) {
    const sTok = estimateTokens(s);
    const add = sTok + (cur.length > 0 ? sepTok : 0);
    if (total + add > chunkSize && cur.length > 0) flush();
    cur.push(s);
    total += add;
  }

  if (cur.length > 0) {
    const doc = cur.join(sep);
    if (doc.trim()) chunks.push(doc);
  }

  return chunks;
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  overlap: number,
): string[] {
  if (estimateTokens(text) <= chunkSize) return text.trim() ? [text] : [];

  let sep = separators[separators.length - 1];
  let remaining: string[] = [];

  for (let i = 0; i < separators.length; i++) {
    if (separators[i] === '' || text.includes(separators[i])) {
      sep = separators[i];
      remaining = separators.slice(i + 1);
      break;
    }
  }

  const splits = sep ? text.split(sep) : [...text];
  const good: string[] = [];
  const result: string[] = [];

  for (const s of splits) {
    if (estimateTokens(s) >= chunkSize) {
      if (good.length > 0) {
        result.push(...mergeRecursiveSplits(good, sep, chunkSize, overlap));
        good.length = 0;
      }
      result.push(
        ...recursiveSplit(s, remaining.length ? remaining : [''], chunkSize, overlap),
      );
    } else {
      good.push(s);
    }
  }

  if (good.length > 0) result.push(...mergeRecursiveSplits(good, sep, chunkSize, overlap));
  return result;
}

function chunkDocumentRecursive(text: string, chunkSize: number, overlap: number): string[] {
  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''];
  return recursiveSplit(text, separators, chunkSize, overlap).filter(
    (c) => c.trim().length > 0,
  );
}

// ─── Embedding ────────────────────────────────────────────────────────────────

async function embedBatch(chunks: string[]): Promise<number[][]> {
  const all: number[][] = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);

    const res = await fetch(
      `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text }] },
            taskType: 'RETRIEVAL_DOCUMENT',
          })),
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini embed error ${res.status}: ${body}`);
    }

    const { embeddings } = (await res.json()) as {
      embeddings: { values: number[] }[];
    };

    all.push(...embeddings.map((e) => e.values));
  }

  return all;
}

// ─── Auto-tagging ─────────────────────────────────────────────────────────────

async function autoTag(
  db: ReturnType<typeof createClient>,
  docId: string,
  text: string,
): Promise<void> {
  const snippet = text.slice(0, 6000);

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
                text: `Extract historical entities from this document text. Return ONLY a JSON array of tag name strings (no explanation, no nesting). Include historical eras, geographic locations, historical figures, and significant events. Maximum 15 tags. Text:\n\n${snippet}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini auto-tag error ${res.status}: ${body}`);
  }

  const geminiResponse = (await res.json()) as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const rawText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

  // Strip markdown code fences if present.
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let tagNames: string[];
  try {
    tagNames = JSON.parse(cleaned);
    if (!Array.isArray(tagNames)) tagNames = [];
  } catch {
    console.warn('[ingest-document] autoTag: failed to parse tag JSON:', cleaned);
    return;
  }

  // Process up to 15 tags.
  for (const rawName of tagNames.slice(0, 15)) {
    if (typeof rawName !== 'string' || !rawName.trim()) continue;

    const tagName = rawName.trim();
    const slug = tagName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) continue;

    await db.from('tags').upsert({ name: tagName, slug }, { onConflict: 'name', ignoreDuplicates: true });

    const { data: tag } = await db.from('tags').select('id').eq('name', tagName).single();
    if (!tag?.id) continue;

    await db.from('document_tags').upsert(
      { document_id: docId, tag_id: tag.id },
      { onConflict: 'document_id,tag_id', ignoreDuplicates: true },
    );
  }
}
