
/**
 * Document chunking — semantic and recursive strategies.
 * No LangChain dependency (see CLAUDE.md).
 *
 * Primary: Semantic chunking (Greg Kamradt method) — uses embedding similarity
 * between consecutive sentences to detect natural topic boundaries, producing
 * variable-size chunks that are semantically coherent.
 *
 * Fallback: RecursiveCharacterTextSplitter — tries each separator in priority
 * order, recursively splits oversized pieces, merges small pieces with overlap.
 */

import {
  CHUNK_SIZE_TOKENS,
  CHUNK_OVERLAP_TOKENS,
  SEMANTIC_BREAKPOINT_METHOD,
  SEMANTIC_BREAKPOINT_THRESHOLD,
  SEMANTIC_MAX_CHUNK_TOKENS,
  SEMANTIC_MIN_CHUNK_TOKENS,
  MAX_SENTENCES_FOR_SEMANTIC,
} from '@/lib/config/constants';

// ─── Shared types & utilities ────────────────────────────────────────────────

export type Chunk = {
  content: string;
  /** Estimated token count (chars / 4). */
  tokenCount: number;
  /** Page number from source; null until extraction stage provides markers. */
  pageNumber: number | null;
};

/** 1 token ≈ 4 characters (sufficient approximation for English text). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Semantic chunking ──────────────────────────────────────────────────────

export type BreakpointMethod = 'percentile' | 'standard_deviation' | 'interquartile';

export type SemanticChunkOptions = {
  /** Function that embeds an array of sentences → raw number[][] vectors. */
  embedFn: (sentences: string[]) => Promise<number[][]>;
  breakpointMethod?: BreakpointMethod;
  breakpointThreshold?: number;
  maxChunkTokens?: number;
  minChunkTokens?: number;
};

/**
 * Split text into semantically coherent chunks using embedding similarity.
 *
 * Algorithm:
 * 1. Segment text into sentences
 * 2. Embed each sentence
 * 3. Compute cosine similarity between consecutive sentence pairs
 * 4. Detect breakpoints where similarity drops below threshold
 * 5. Assemble chunks by grouping sentences between breakpoints
 * 6. Enforce guardrails (split oversized, merge undersized)
 */
export async function chunkTextSemantic(
  text: string,
  options: SemanticChunkOptions,
): Promise<Chunk[]> {
  const {
    embedFn,
    breakpointMethod = SEMANTIC_BREAKPOINT_METHOD,
    breakpointThreshold = SEMANTIC_BREAKPOINT_THRESHOLD,
    maxChunkTokens = SEMANTIC_MAX_CHUNK_TOKENS,
    minChunkTokens = SEMANTIC_MIN_CHUNK_TOKENS,
  } = options;

  const sentences = segmentSentences(text);

  // Too few sentences — return the whole text as one chunk
  if (sentences.length <= 2) {
    const content = text.trim();
    if (!content) return [];
    return [{ content, tokenCount: estimateTokens(content), pageNumber: null }];
  }

  // Too many sentences — fall back to recursive splitter
  if (sentences.length > MAX_SENTENCES_FOR_SEMANTIC) {
    console.warn(
      `[chunker] ${sentences.length} sentences exceeds limit of ${MAX_SENTENCES_FOR_SEMANTIC}, falling back to recursive splitter`,
    );
    return chunkText(text);
  }

  // Step 2: Embed all sentences
  const embeddings = await embedFn(sentences);

  // Step 3: Compute cosine similarity between consecutive pairs
  const similarities: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // Step 4: Detect breakpoints
  const breakpoints = detectBreakpoints(similarities, breakpointMethod, breakpointThreshold);

  // Step 5: Assemble chunks from sentence groups
  const rawChunks = assembleChunks(sentences, breakpoints);

  // Step 6: Enforce size guardrails
  return enforceGuardrails(rawChunks, maxChunkTokens, minChunkTokens);
}

/**
 * Segment text into sentences using regex-based boundary detection.
 * Handles common abbreviations and decimal numbers to avoid false splits.
 */
export function segmentSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace and an uppercase letter,
  // or on paragraph breaks. Preserve the punctuation with the preceding sentence.
  const sentences: string[] = [];
  // Regex: match sentence-ending punctuation (.!?) followed by whitespace then uppercase,
  // or paragraph breaks. Uses lookbehind/lookahead to keep punctuation attached.
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
export function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Detect breakpoint indices where similarity drops below the threshold.
 * Returns an array of indices into the similarities array where a chunk
 * boundary should be placed (i.e., between sentence[i] and sentence[i+1]).
 */
export function detectBreakpoints(
  similarities: number[],
  method: BreakpointMethod,
  threshold: number,
): number[] {
  if (similarities.length === 0) return [];

  const cutoff = computeCutoff(similarities, method, threshold);

  const breakpoints: number[] = [];
  for (let i = 0; i < similarities.length; i++) {
    if (similarities[i] < cutoff) {
      breakpoints.push(i);
    }
  }
  return breakpoints;
}

function computeCutoff(
  similarities: number[],
  method: BreakpointMethod,
  threshold: number,
): number {
  const sorted = [...similarities].sort((a, b) => a - b);
  const n = sorted.length;

  switch (method) {
    case 'percentile': {
      // threshold = percentile value (e.g. 75 means below the 75th percentile)
      const idx = Math.floor((threshold / 100) * (n - 1));
      return sorted[idx];
    }
    case 'standard_deviation': {
      const mean = similarities.reduce((s, v) => s + v, 0) / n;
      const variance = similarities.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
      const stddev = Math.sqrt(variance);
      // threshold = number of standard deviations below the mean
      return mean - threshold * stddev;
    }
    case 'interquartile': {
      const q1Idx = Math.floor(0.25 * (n - 1));
      const q3Idx = Math.floor(0.75 * (n - 1));
      const q1 = sorted[q1Idx];
      const q3 = sorted[q3Idx];
      const iqr = q3 - q1;
      // threshold = IQR multiplier below Q1
      return q1 - threshold * iqr;
    }
  }
}

/**
 * Group sentences into chunks based on breakpoint indices.
 * Breakpoint at index i means: split between sentence[i] and sentence[i+1].
 */
function assembleChunks(sentences: string[], breakpoints: number[]): Chunk[] {
  const chunks: Chunk[] = [];
  const bpSet = new Set(breakpoints);

  let start = 0;
  for (let i = 0; i < sentences.length; i++) {
    // If this index is a breakpoint, or we're at the last sentence
    if (bpSet.has(i) || i === sentences.length - 1) {
      const end = i === sentences.length - 1 ? i + 1 : i + 1;
      const content = sentences.slice(start, end).join(' ').trim();
      if (content) {
        chunks.push({
          content,
          tokenCount: estimateTokens(content),
          pageNumber: null,
        });
      }
      start = end;
    }
  }

  // If there are remaining sentences after the last breakpoint
  if (start < sentences.length) {
    const content = sentences.slice(start).join(' ').trim();
    if (content) {
      chunks.push({
        content,
        tokenCount: estimateTokens(content),
        pageNumber: null,
      });
    }
  }

  return chunks;
}

/**
 * Enforce chunk size guardrails:
 * - Split chunks exceeding maxChunkTokens using the recursive fallback
 * - Merge chunks below minChunkTokens with their nearest neighbor
 */
function enforceGuardrails(
  chunks: Chunk[],
  maxChunkTokens: number,
  minChunkTokens: number,
): Chunk[] {
  // Phase 1: Split oversized chunks
  const split: Chunk[] = [];
  for (const chunk of chunks) {
    if (chunk.tokenCount > maxChunkTokens) {
      // Use recursive splitter for oversized chunks
      split.push(...chunkText(chunk.content, { chunkSize: maxChunkTokens }));
    } else {
      split.push(chunk);
    }
  }

  // Phase 2: Merge undersized chunks with the next neighbor
  const merged: Chunk[] = [];
  let buffer = '';

  for (const chunk of split) {
    if (buffer) {
      buffer += ' ' + chunk.content;
    } else {
      buffer = chunk.content;
    }

    if (estimateTokens(buffer) >= minChunkTokens) {
      merged.push({
        content: buffer,
        tokenCount: estimateTokens(buffer),
        pageNumber: null,
      });
      buffer = '';
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    if (merged.length > 0) {
      // Append to the last chunk rather than creating a tiny trailing chunk
      const last = merged[merged.length - 1];
      last.content += ' ' + buffer.trim();
      last.tokenCount = estimateTokens(last.content);
    } else {
      merged.push({
        content: buffer.trim(),
        tokenCount: estimateTokens(buffer.trim()),
        pageNumber: null,
      });
    }
  }

  return merged;
}

// ─── Recursive character splitter (fallback) ─────────────────────────────────

/**
 * Merge an array of splits (from a single separator pass) back into
 * chunks of at most `chunkSize` tokens, retaining an `overlap` tail
 * from the previous chunk.
 */
function mergeRecursiveSplits(
  splits: string[],
  separator: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const chunks: string[] = [];
  const current: string[] = [];
  let total = 0;
  const sepTokens = estimateTokens(separator);

  const flush = () => {
    if (current.length === 0) return;
    const doc = current.join(separator);
    if (doc.trim()) chunks.push(doc);

    // Trim front of current until we're within the overlap budget.
    while (current.length > 0) {
      const headTokens =
        estimateTokens(current[0]) + (current.length > 1 ? sepTokens : 0);
      if (total - headTokens < overlap) break;
      total -= headTokens;
      current.shift();
    }
  };

  for (const split of splits) {
    const splitTokens = estimateTokens(split);
    const addTokens = splitTokens + (current.length > 0 ? sepTokens : 0);

    if (total + addTokens > chunkSize && current.length > 0) {
      flush();
    }

    current.push(split);
    total += addTokens;
  }

  if (current.length > 0) {
    const doc = current.join(separator);
    if (doc.trim()) chunks.push(doc);
  }

  return chunks;
}

/**
 * Recursively split `text` using the highest-priority separator that
 * exists in the text, then merge small pieces back up to chunkSize.
 */
function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  overlap: number,
): string[] {
  if (estimateTokens(text) <= chunkSize) return text.trim() ? [text] : [];

  // Find the first separator present in the text (or fall back to last).
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
      // Flush accumulated good splits, then recurse into the large piece.
      if (good.length > 0) {
        result.push(...mergeRecursiveSplits(good, sep, chunkSize, overlap));
        good.length = 0;
      }
      const nextSeps = remaining.length ? remaining : [''];
      result.push(...recursiveSplit(s, nextSeps, chunkSize, overlap));
    } else {
      good.push(s);
    }
  }

  if (good.length > 0) {
    result.push(...mergeRecursiveSplits(good, sep, chunkSize, overlap));
  }

  return result;
}

/**
 * Recursive character splitter — fallback when semantic chunking is not
 * viable (too many sentences, or used for splitting oversized semantic chunks).
 *
 * Separator priority (highest → lowest):
 *   paragraph break → line break → sentence end → semicolon →
 *   comma → space → character
 */
export function chunkText(
  text: string,
  options: { chunkSize?: number; overlap?: number } = {},
): Chunk[] {
  const chunkSize = options.chunkSize ?? CHUNK_SIZE_TOKENS;
  const overlap = options.overlap ?? CHUNK_OVERLAP_TOKENS;

  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''];
  const raw = recursiveSplit(text, separators, chunkSize, overlap);

  return raw
    .map((content) => ({
      content: content.trim(),
      tokenCount: estimateTokens(content),
      pageNumber: null,
    }))
    .filter((c) => c.content.length > 0);
}
