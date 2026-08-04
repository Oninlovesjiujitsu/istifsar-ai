export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

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

export function chunkDocumentRecursive(text: string, chunkSize: number, overlap: number): string[] {
  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''];
  return recursiveSplit(text, separators, chunkSize, overlap).filter(
    (c) => c.trim().length > 0,
  );
}
