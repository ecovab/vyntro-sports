/**
 * Cheap, deterministic guards that run after every Claude call. They don't
 * prove correctness, but they catch the most common failure modes (wrong
 * scoreline, missing team names, off-topic rewrites) so a bad generation
 * never reaches a user — it falls back to a templated, fact-only string.
 */

export function containsAllTerms(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.every((term) => lower.includes(term.toLowerCase()));
}

export function wordOverlapRatio(candidate: string, source: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
  const candidateWords = tokenize(candidate);
  const sourceWords = tokenize(source);
  if (candidateWords.size === 0) return 0;
  let overlap = 0;
  for (const word of candidateWords) {
    if (sourceWords.has(word)) overlap += 1;
  }
  return overlap / candidateWords.size;
}
