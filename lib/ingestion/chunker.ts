
/**
 * RecursiveCharacterTextSplitter — implemented from scratch.
 * No LangChain dependency (see CLAUDE.md).
 *
 * Mirrors the algorithm in LangChain's RecursiveCharacterTextSplitter:
 * tries each separator in priority order, recursively splits oversized
 * pieces, then merges small pieces back up to chunkSize with overlap.
 */

import { CHUNK_SIZE_TOKENS, CHUNK_OVERLAP_TOKENS } from '@/lib/config/constants';

/** 1 token ≈ 4 characters (sufficient approximation for English/Spanish text). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Merge an array of splits (from a single separator pass) back into
 * chunks of at most `chunkSize` tokens, retaining an `overlap` tail
 * from the previous chunk.
 */
function mergeChunks(
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
        result.push(...mergeChunks(good, sep, chunkSize, overlap));
        good.length = 0;
      }
      const nextSeps = remaining.length ? remaining : [''];
      result.push(...recursiveSplit(s, nextSeps, chunkSize, overlap));
    } else {
      good.push(s);
    }
  }

  if (good.length > 0) {
    result.push(...mergeChunks(good, sep, chunkSize, overlap));
  }

  return result;
}

export type Chunk = {
  content: string;
  /** Estimated token count (chars / 4). */
  tokenCount: number;
  /** Page number from source; null until extraction stage provides markers. */
  pageNumber: number | null;
};

/**
 * Split extracted document text into overlapping chunks suitable for
 * embedding and storage in document_chunks.
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
