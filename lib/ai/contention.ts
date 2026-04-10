/**
 * Contention detection — the only place in the codebase that uses LangChain.js.
 * (Per the Agoncillo Constraint: all other AI flows use Vercel AI SDK directly.)
 *
 * Fires after a document is published. Checks the new document against the 5
 * most semantically similar existing published documents and records any
 * factual contradictions in the `contentions` table.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableLambda } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { MODELS } from '@/lib/config/models';
import { createAdminClient } from '@/lib/supabase/admin';

const CONTENTION_PROMPT = ChatPromptTemplate.fromTemplate(`
You are a historical fact-checker analyzing two academic history sources for
factual contradictions.

Source A — "{titleA}":
{docA}

Source B — "{titleB}":
{docB}

Do these sources contradict each other on any specific historical fact, date,
person, event, or causal claim?

Respond with ONLY a JSON object in this exact shape (no markdown, no prose):
{{
  "contradiction": true/false,
  "topic":       "short phrase naming what is disputed, e.g. 'the date of Rizal's execution'",
  "title":       "brief headline for this disagreement",
  "description": "one-sentence explanation",
  "claims": [
    {{ "source": "A", "claim": "short version of what A says", "excerpt": "verbatim quote from A (max 40 words)" }},
    {{ "source": "B", "claim": "short version of what B says", "excerpt": "verbatim quote from B (max 40 words)" }}
  ]
}}

If no contradiction exists, return {{"contradiction": false, "topic": null, "title": null, "description": null, "claims": []}}.
`);

type ParsedContention = {
  contradiction: boolean;
  topic: string | null;
  title: string | null;
  description: string | null;
  claims: Array<{
    source: 'A' | 'B' | string;
    claim: string;
    excerpt: string | null;
  }>;
};

export async function detectContentions(documentId: string): Promise<void> {
  try {
    const db = createAdminClient();

    // 1. Fetch the new document's first 3 chunks
    const { data: newChunks } = await db
      .from('document_chunks')
      .select('content, embedding')
      .eq('document_id', documentId)
      .order('chunk_index')
      .limit(3);

    if (!newChunks?.length) return;

    const { data: newDoc } = await db
      .from('documents')
      .select('title')
      .eq('id', documentId)
      .single();

    const docAText = newChunks.map((c) => c.content).join('\n\n');
    const firstEmbedding = (newChunks[0] as { content: string; embedding: unknown }).embedding;

    if (!firstEmbedding) return;

    // 2. Find semantically similar published documents via pgvector RPC
    // Cast to any because the generated types don't include this helper function yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: similarDocsRaw } = await (db as any).rpc('find_similar_documents', {
      query_vector: firstEmbedding,
      exclude_document_id: documentId,
      match_count: 5,
    });

    const similarDocs = similarDocsRaw as Array<{
      document_id: string;
      title: string;
      content: string;
    }> | null;

    if (!similarDocs || similarDocs.length === 0) return;

    // 3. Use LangChain chain composition to check each pair for contradictions
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const outputParser = new StringOutputParser();

    const chain = CONTENTION_PROMPT.pipe(
      RunnableLambda.from(async (promptValue) => {
        const { text } = await generateText({
          model: google(MODELS.fast),
          prompt: promptValue.toString(),
        });
        return text;
      }),
    ).pipe(outputParser);

    for (const similar of similarDocs) {
      try {
        const result = await chain.invoke({
          docA: docAText,
          docB: similar.content,
          titleA: newDoc?.title ?? 'Unknown',
          titleB: similar.title ?? 'Unknown',
        });

        // Strip any accidental markdown fences
        const cleaned = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned) as ParsedContention;

        if (parsed.contradiction) {
          const claims = (parsed.claims ?? []).map((c) => ({
            document_id: c.source === 'A' ? documentId : similar.document_id,
            claim: c.claim,
            excerpt: c.excerpt ?? null,
          }));

          await db.from('contentions').insert({
            title: parsed.title ?? 'Potential contradiction detected',
            description: parsed.description ?? null,
            topic: parsed.topic ?? null,
            claims,
            document_ids: [documentId, similar.document_id],
            essay_ids: [],
            status: 'open',
          });
        }
      } catch (pairErr) {
        console.warn('[contention] pair check failed:', pairErr);
      }
    }
  } catch (err) {
    console.warn('[contention] detectContentions failed:', err);
  }
}
