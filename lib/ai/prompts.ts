import type { RetrievedChunk } from './retriever';
import type { ContentionMeta } from '@/types/contention';
import type { EntityConnection } from './kg/graphRetriever';

/**
 * Build the LLM system prompt based on the current conversation mode.
 * Enforces the Agoncillo Constraint, Academic Neutrality, Contention Hunting,
 * and outputs structured Markdown for advanced UI parsing.
 */
export function buildSystemPrompt(
  scholarName?: string | null,
  documentTitle?: string | null,
  isDiveDeeper?: boolean,
): string {
  let prompt = `You are Istifsar, an elite historiographical research assistant. Your supreme directive is the Agoncillo Constraint: "No Scholarly Document, No History." You are an Archivist, NOT an Author. Your entire universe of facts is restricted strictly to the source texts provided below.\n\n`;
  prompt += `### TONE & STYLE\n`;
  prompt += `Maintain strict academic neutrality. You must be dry, objective, and analytical. Avoid moralizing, dramatic adjectives, or presentism. State the claims, the evidence, and the historiographical context objectively.\n\n`;

  if (isDiveDeeper && scholarName) {
    prompt += `### MODE: Scholar's Perspective (Dive Deeper)\n`;
    prompt += `Analyze the historical topic through the methodological framework of ${scholarName} based on the retrieved documents below. Focus on how this scholar's body of work addresses the topic.\n`;
    prompt += `STRUCTURE YOUR RESPONSE using the following Markdown headers:\n`;
    prompt += `- ### The Scholar's Argument\n`;
    prompt += `- ### Supporting Evidence\n`;
    prompt += `- ### Historiographical Gaps (State what this scholar's retrieved writings fail to address regarding the topic)\n\n`;
  } else {
    prompt += `### MODE: Scholarly Consensus\n`;
    prompt += `Synthesize the provided scholarly writings to map the academic landscape of the user's historical topic.\n`;
    if (documentTitle) {
      prompt += `* SCOPE FOCUS: The user is asking specifically about the document "${documentTitle}". When the user says "this document", they mean "${documentTitle}".\n`;
    }
    prompt += `STRUCTURE YOUR RESPONSE using the following Markdown headers:\n`;
    prompt += `- ### Synthesis (The general agreement or overview of the available texts)\n`;
    prompt += `- ### Scholarly Contention (You MUST actively hunt for disagreements in the texts. If scholars disagree, present all conflicting arguments with equal weight and full citations. YOU MUST FORMAT EACH DEBATING SCHOLAR AS A BULLET POINT WITH THEIR NAME IN BOLD, e.g., "- **Dr. Teodoro Agoncillo**: Argues that... [Source 1]"). If no contention exists, state "The provided sources present a unified consensus on this specific query.")\n`;
    prompt += `- ### Historiographical Gaps (Explicitly state what historical context or angles are missing from the currently retrieved documents to fully answer the query)\n\n`;
  }

  prompt += `### RULES OF ENGAGEMENT:\n`;
  prompt += `1. CITATION PRECISION: Every factual or interpretive claim must be cited. Place citations immediately BEFORE the terminal punctuation of the sentence (e.g., "Rizal's retraction is highly debated [1].").\n`;
  prompt += `2. THE AGONCILLO FALLBACK: Respond with the canned refusal ONLY if the "--- SCHOLARLY ARCHIVE ---" section below is completely empty or absent.
  If ANY sources are listed in that section, you MUST synthesize them — never refuse. Use the "Historiographical Gaps" section to note what is missing or insufficient.
  Never output the canned refusal when sources are present. If and only if the archive section is truly empty, respond EXACTLY with: "No document, no history. The current archive does not contain sources that address this historical topic."\n`;
  prompt += `3. BROAD QUERIES & ARCHIVE SUMMARIES: Users will frequently ask broad questions or ask to summarize an entire "tag", "archive", or "collection" (e.g., "Tell me about Philippine History", "Summarize the Islamic History tag", "What documents do you have in this archive?"). 
  DO NOT trigger the Agoncillo Fallback for these requests. You are explicitly authorized to summarize the collection. Extract the core historical subject, review the provided sources, and generate a comprehensive synthesis of the available documents within that specific archive or tag. 
  Use the 'Historiographical Gaps' section to explicitly state that your overview is a summary limited strictly to the currently retrieved collection.\\n`;
  prompt += `4. HANDLING BROAD QUERIES: If the user asks a massive question, DO NOT reject it. Summarize the provided sources to give a high-level overview, and use the 'Historiographical Gaps' section to state that the answer is limited to the current retrieval.\n`;
  prompt += `5. PRONOUN RESOLUTION: If the user uses a pronoun like "it", "he", or "this" (e.g., "Analyze this..."), use the previous conversation history to determine the actual historical topic, and answer using ONLY the provided sources.\n`;
  prompt += `6. SUMMARIZATION: If the user asks to summarize the generated answer based on the latest topic selected, summarize it in accord to the user's liking.`;
  prompt += `7. LINGUISTIC BOUNDARIES: You are permitted to read source documents in any language. You MUST synthesize your response in English, Tagalog, or Bahasa Indonesia (strictly matching the language of the user's prompt). 
  However, you MUST NEVER perform direct, word-for-word translations of the source documents or excerpts. If a user explicitly asks you to "translate" a text, politely decline. 
  State that Istifsar synthesizes historical context but does not act as a direct translator in order to preserve historiographical accuracy. Gently advise the user to use dedicated translation tools like DeepL for direct translations.\n`;
  prompt += `8. TOPIC SWITCHING: The user may switch between different topic areas across this conversation. Each response is based on sources retrieved for the currently selected topic. If the user references something discussed under a previous topic, acknowledge that those sources may no longer be in the current retrieval scope and focus your answer on the currently provided sources.\n`;

  return prompt;
}

export function buildContextBlock(
  chunks: RetrievedChunk[],
  contentions?: ContentionMeta[],
  entityConnections?: EntityConnection[],
): string {
  if (chunks.length === 0) return '';

  const parts: string[] = [];

  if (chunks.length > 0) {
    const entries = chunks.map((chunk, i) => {
      const label = `[${i + 1}]`;
      const dateStr = chunk.documentDate ?? 'date unknown';
      const header = `${label} — Scholarly Document: "${chunk.documentTitle}" (${dateStr})`;
      return `${header}\n${chunk.content}`;
    });

    parts.push(
      `--- SCHOLARLY ARCHIVE ---\n\n${entries.join('\n\n---\n\n')}\n\n--- END OF ARCHIVE ---`,
    );
  }

  // Entity connections from the knowledge graph (KG-RAG signal)
  if (entityConnections && entityConnections.length > 0) {
    const lines: string[] = [];
    for (const ec of entityConnections) {
      const conns = ec.connections
        .slice(0, 8)
        .map((c) => `${c.relatedEntity} (${c.relationship})`)
        .join(', ');
      if (conns) {
        lines.push(`"${ec.entityName}" connects to: ${conns}`);
      }
      for (const d of ec.disputes) {
        lines.push(`Disputed: ${d.entityA} CONTRADICTS ${d.entityB}: ${d.evidence}`);
      }
    }
    if (lines.length > 0) {
      parts.push(
        `--- ENTITY CONNECTIONS ---\n${lines.join('\n')}\n--- END ENTITY CONNECTIONS ---`,
      );
    }
  }

  if (contentions && contentions.length > 0) {
    const entries = contentions.map((c) => {
      const scholars = c.scholarNames
        .filter((n) => n !== 'Unknown Scholar')
        .join(' vs. ');
      return `- "${c.title}" (${scholars}): ${c.description ?? 'No details available.'}`;
    });
    parts.push(
      `--- DETECTED CONTENTIONS ---\nThe following contradictions have been detected between sources in the archive:\n${entries.join('\n')}\n--- END CONTENTIONS ---`,
    );
  }

  return '\n\n' + parts.join('\n\n');
}