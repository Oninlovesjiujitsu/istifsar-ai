import { createClient } from 'npm:@supabase/supabase-js@2';
import { createDbClient, setStatus } from './src/db.ts';
import { extractText } from './src/extractors.ts';
import { chunkDocumentRecursive } from './src/chunking.ts';
import { embedBatch } from './src/embeddings.ts';
import { autoTag, extractAndLinkKG } from './src/knowledge_graph.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type WebhookPayload = {
  type: 'INSERT';
  table: string;
  record: { id: string };
};

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const docId = payload.record?.id;

    if (!docId) {
      console.error('[ingest-document] Missing document id in payload');
      return ok({ error: 'Missing document id' });
    }

    const db = createDbClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: doc, error: fetchErr } = await db
      .from('documents')
      .select('id, storage_path, transcription_path, original_filename, mime_type, submitter_id, status')
      .eq('id', docId)
      .single();

    if (fetchErr || !doc) {
      console.error('[ingest-document] Failed to fetch document:', fetchErr?.message);
      return ok({ error: `Document not found: ${docId}` });
    }

    await setStatus(db, doc.id, 'processing');

    try {
      // 1. Text Extraction
      const text = await extractText(db, doc);

      if (!text.trim()) {
        throw new Error('Extracted text is empty');
      }

      // 2. Chunking
      const chunks = chunkDocumentRecursive(text, 800, 150);

      // 3. Auto-Tagging (non-blocking)
      autoTag(db, doc.id, text).catch((err) => {
        console.error('[ingest-document] Auto-tagging failed (non-fatal):', err);
      });

      // 4. Vector Embedding
      const vectors = await embedBatch(chunks.map(c => c.content));
      if (vectors.length !== chunks.length) {
        throw new Error(`Embedding count mismatch: got ${vectors.length}, expected ${chunks.length}`);
      }

      // 5. Save Chunks
      await db.from('document_chunks').delete().eq('document_id', doc.id);
      const insertedChunks: Array<{ id: string; content: string }> = [];

      for (let i = 0; i < chunks.length; i += 100) {
        const batch = chunks.slice(i, i + 100).map((chunk, j) => ({
          document_id: doc.id,
          chunk_index: i + j,
          content: chunk.content,
          token_count: chunk.tokenCount,
          page_number: null,
          embedding: `[${vectors[i + j].join(',')}]`,
        }));

        const { data, error } = await db.from('document_chunks').insert(batch).select('id, content');
        if (error) throw new Error(`Chunk insert failed: ${error.message}`);
        if (data) insertedChunks.push(...data);
      }

      await setStatus(db, doc.id, 'done', undefined, doc.submitter_id, doc.status);

      // 6. Knowledge Graph Extraction (non-blocking)
      try {
        const docTitle = (await db.from('documents').select('title, submitter_id, profiles!documents_submitter_id_fkey(display_name)').eq('id', doc.id).single()).data;
        const authorName = (docTitle?.profiles as { display_name?: string } | null)?.display_name ?? null;
        await extractAndLinkKG(db, doc.id, insertedChunks, docTitle?.title ?? 'Unknown', authorName);
      } catch (kgErr) {
        console.warn('[ingest-document] KG extraction failed (non-fatal):', kgErr);
      }

      return ok({ chunks: chunks.length, method: 'recursive' });
    } catch (inner) {
      const msg = inner instanceof Error ? inner.message : String(inner);
      console.error('[ingest-document] Pipeline error:', msg);
      await setStatus(db, doc.id, 'failed', msg, doc.submitter_id, doc.status);
      return ok({ error: msg });
    }
  } catch (outer) {
    console.error('[ingest-document] Handler error:', outer);
    return ok({ error: String(outer) });
  }
});
