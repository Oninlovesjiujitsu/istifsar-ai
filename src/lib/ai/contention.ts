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
import { MODELS } from '@/src/lib/config/models';
import { createAdminClient } from '@/src/lib/supabase/admin';

const CONTENTION_PROMPT = ChatPromptTemplate.fromTemplate(`
You are a historical fact-checker analyzing multiple academic history sources for
factual contradictions.

{sourcesText}

Do any of these sources contradict each other on any specific historical fact, date,
person, event, or causal claim? Note that a contradiction might only involve a subset of the sources.

Respond with ONLY a JSON object in this exact shape (no markdown, no prose). If there are multiple contradictions, include them all in the "contradictions" array:
{{
  "contradictions": [
    {{
      "topic":       "short phrase naming what is disputed, e.g. 'the date of Rizal's execution'",
      "title":       "brief headline for this disagreement",
      "description": "one-sentence explanation detailing the conflict",
      "claims": [
        {{ 
          "document_id": "the exact document ID of the source (e.g. 550e8400-e29b-41d4-a716-446655440000)", 
          "historian_name": "extracted author of this source", 
          "argument_headline": "1-2 sentence headline of this source's argument on this topic", 
          "claim": "short version of what this source says about this topic", 
          "excerpt": "verbatim quote from this source (max 40 words)" 
        }}
        // Include one claim entry for each document involved in this specific contradiction.
      ]
    }}
  ]
}}

If no contradiction exists among any of the sources, return {{"contradictions": []}}.
`);

type ParsedContention = {
  topic: string;
  title: string;
  description: string;
  claims: Array<{
    document_id: string;
    historian_name?: string | null;
    argument_headline?: string | null;
    claim: string;
    excerpt: string | null;
  }>;
};

type ParsedContentionResult = {
  contradictions: ParsedContention[];
};

export async function detectContentions(documentId: string): Promise<void> {
  console.log(`[contention] detectContentions starting for document: ${documentId}`);
  try {
    const db = createAdminClient();

    // 1. Poll the database until the new document's chunks are generated (up to 2 minutes)
    let newChunks: any[] | null = null;
    const maxAttempts = 24; // 24 attempts * 5s = 2 minutes max
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { data } = await db
        .from('document_chunks')
        .select('content, embedding')
        .eq('document_id', documentId)
        .order('chunk_index')
        .limit(3);

      if (data && data.length > 0) {
        newChunks = data;
        break;
      }

      console.log(`[contention] Chunks not ready yet for document: ${documentId} (attempt ${attempt}/${maxAttempts}). Waiting 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (!newChunks?.length) {
      console.log(`[contention] No chunks found after 2 minutes for document: ${documentId}. Aborting.`);
      return;
    }

    const { data: newDoc } = await db
      .from('documents')
      .select('title, author_name')
      .eq('id', documentId)
      .single();

    const docAText = newChunks.map((c) => c.content).join('\n\n');
    const firstEmbedding = (newChunks[0] as { content: string; embedding: unknown }).embedding;

    if (!firstEmbedding) {
      console.log(`[contention] No embedding found for first chunk of document: ${documentId}. Aborting.`);
      return;
    }

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

    if (!similarDocs || similarDocs.length === 0) {
      console.log(`[contention] No similar published documents found to compare against document: ${documentId}.`);
      return;
    }

    // Fetch author_name for similar documents to enrich the context
    const similarDocIds = similarDocs.map((s) => s.document_id);
    const { data: similarDocsMeta } = await db
      .from('documents')
      .select('id, author_name')
      .in('id', similarDocIds);

    const authorMap = new Map<string, string>();
    if (similarDocsMeta) {
      for (const d of similarDocsMeta) {
        if (d.author_name) {
          authorMap.set(d.id, d.author_name);
        }
      }
    }

    const docsToCompare = [
      {
        id: documentId,
        title: newDoc?.title ?? 'Unknown Document',
        authorName: newDoc?.author_name ?? 'Unknown Scholar',
        content: docAText,
      },
      ...similarDocs.map((s) => ({
        id: s.document_id,
        title: s.title,
        authorName: authorMap.get(s.document_id) ?? 'Unknown Scholar',
        content: s.content,
      })),
    ];

    console.log(`[contention] Comparing new document "${newDoc?.title}" against ${similarDocs.length} similar documents simultaneously...`);

    const sourcesText = docsToCompare
      .map((doc, idx) => {
        return `Document #${idx + 1}:
ID: ${doc.id}
Title: "${doc.title}"
Author/Historian: ${doc.authorName}
Content:
${doc.content}`;
      })
      .join('\n\n========================================\n\n');

    // 3. Use LangChain chain composition to check all documents at once
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const outputParser = new StringOutputParser();

    const chain = CONTENTION_PROMPT.pipe(
      RunnableLambda.from(async (promptValue) => {
        const { text } = await generateText({
          model: google(MODELS.fast),
          prompt: promptValue.toString(),
          providerOptions: {
            google: {
              threshold: 'BLOCK_NONE',
            },
          },
        });
        return text;
      }),
    ).pipe(outputParser);

    try {
      const result = await chain.invoke({
        sourcesText,
      });

      // Strip any accidental markdown fences
      const cleaned = result.replace(/```json|```/g, '').trim();
      const parsedResult = JSON.parse(cleaned) as ParsedContentionResult;

      if (parsedResult.contradictions && parsedResult.contradictions.length > 0) {
        for (const parsed of parsedResult.contradictions) {
          // Extract involved document IDs from the claims
          const involvedDocIds = (parsed.claims ?? [])
            .map((c) => c.document_id)
            .filter((id): id is string => !!id && docsToCompare.some((d) => d.id === id));

          if (involvedDocIds.length < 2) {
            console.log(`[contention] Skipping contradiction for topic "${parsed.topic}" because it involves fewer than 2 valid documents.`);
            continue;
          }

          // We only insert the contradiction if it actually involves our newly uploaded document
          const hasNewDoc = involvedDocIds.includes(documentId);
          if (!hasNewDoc) {
            console.log(`[contention] Skipping contradiction for topic "${parsed.topic}" because it does not involve the newly uploaded document ${documentId}.`);
            continue;
          }

          console.log(`[contention] CONTRADICTION DETECTED! Topic: "${parsed.topic}". Inserting to DB. Documents involved: [${involvedDocIds.join(', ')}]`);
          const claims = (parsed.claims ?? []).map((c) => ({
            document_id: c.document_id,
            historian_name: c.historian_name ?? null,
            argument_headline: c.argument_headline ?? c.claim,
            claim: c.claim,
            excerpt: c.excerpt ?? null,
          }));

          await db.from('contentions').insert({
            title: parsed.title ?? 'Potential contradiction detected',
            description: parsed.description ?? null,
            topic: parsed.topic ?? null,
            claims,
            document_ids: involvedDocIds,
            essay_ids: [],
            status: 'open',
          });
        }
      } else {
        console.log(`[contention] No contradictions found among the ${docsToCompare.length} documents.`);
      }
    } catch (apiErr) {
      console.warn('[contention] AI check failed:', apiErr);
    }

    console.log(`[contention] detectContentions complete for document: ${documentId}`);
  } catch (err) {
    console.warn('[contention] detectContentions failed:', err);
  }
}
