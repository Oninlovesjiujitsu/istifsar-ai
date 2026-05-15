/**
 * Model name constants for the Vercel AI SDK Google Gemini provider.
 * Never hardcode model names elsewhere — always import from here.
 */

export const MODELS = {
  /** Fast responses: retrieval-grounded Q&A */
  fast: "gemini-2.5-flash",
  /** Text embeddings: 3072 dimensions */
  embedding: "gemini-embedding-001",
} as const;

export type ModelKey = keyof typeof MODELS;
