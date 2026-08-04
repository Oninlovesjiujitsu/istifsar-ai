const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBED_BATCH = 100;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function embedBatch(chunks: string[]): Promise<number[][]> {
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
