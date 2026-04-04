import type { RetrievedChunk } from './retriever';

/**
 * Build the LLM system prompt based on the current conversation mode.
 * The system prompt encodes the Agoncillo Constraint: the AI is a Librarian,
 * not an Author. Every claim must be supported by a source in the context block.
 */
export function buildSystemPrompt(
  mode: 'raw_evidence' | 'interpreted',
  lensTitle?: string | null,
  documentTitle?: string | null,
): string {
  if (mode === 'interpreted' && lensTitle) {
    return `You are Istifsar, a history research assistant. You are operating in Interpreted mode.

The sources below include primary documents and a historian's perspective essay by ${lensTitle}. You may synthesize and analyze across these sources, but every interpretive claim must be grounded in the provided sources. Do not introduce facts, dates, or arguments from outside this context window.

You are a Librarian, not an Author. If the provided sources do not contain enough information to support a claim, acknowledge the gap rather than speculating.

Format your response in clear paragraphs. After each factual or interpretive claim, reference the source with [Source N]. If the sources do not address the question at all, say "The available sources do not address this question."`;
  }

  const docScope = documentTitle
    ? ` The user is asking specifically about the document "${documentTitle}". All provided sources below are excerpts from this document. When the user says "this document", they mean "${documentTitle}".`
    : '';

  return `You are Istifsar, a history research assistant. Your role is to answer questions using ONLY the primary source documents provided below. You are a Librarian, not an Author.${docScope}

Do not add interpretation, speculation, or knowledge from outside these sources. Every claim must be directly supported by a quoted or paraphrased excerpt from the provided documents.

If the documents do not contain enough information to answer, say "The available sources do not address this question."

Format your response in clear paragraphs. After each factual claim, reference the source with [Source N].`;
}

/**
 * Build the context block injected into the system prompt.
 * Each chunk is labelled [Source N] so the LLM can cite them by number.
 * When a lens essay is provided (interpreted mode), it is prepended as a
 * labelled section so the LLM can reference the historian's perspective.
 */
export function buildContextBlock(
  chunks: RetrievedChunk[],
  lensEssay?: { title: string; content: string } | null,
): string {
  if (chunks.length === 0 && !lensEssay) return '';

  const parts: string[] = [];

  if (lensEssay) {
    parts.push(
      `--- HISTORIAN'S PERSPECTIVE: "${lensEssay.title}" ---\n\n${lensEssay.content}\n\n--- END PERSPECTIVE ---`,
    );
  }

  if (chunks.length > 0) {
    const entries = chunks.map((chunk, i) => {
      const label = `[Source ${i + 1}]`;
      const dateStr = chunk.documentDate ?? 'date unknown';
      const header = `${label} — "${chunk.documentTitle}" (${dateStr})`;
      return `${header}\n${chunk.content}`;
    });

    parts.push(
      `--- PRIMARY SOURCES ---\n\n${entries.join('\n\n---\n\n')}\n\n--- END OF SOURCES ---`,
    );
  }

  return '\n\n' + parts.join('\n\n');
}
