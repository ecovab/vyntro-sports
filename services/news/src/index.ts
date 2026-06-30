export interface RawArticle {
  sourceUrl: string;
  sourceId: string;
  sportId?: string;
  title: string;
  content?: string;
  imageUrl?: string;
  publishedAt: string;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Drops articles whose normalized title collides with one already seen in this
 * batch, keeping the earliest-published copy. Cross-batch dedup against
 * already-persisted articles happens in ingestNewsArticles via the DB's unique
 * constraint on url.
 */
export async function deduplicateArticles(articles: RawArticle[]): Promise<RawArticle[]> {
  const seen = new Map<string, RawArticle>();
  for (const article of articles) {
    const key = normalizeTitle(article.title);
    const existing = seen.get(key);
    if (!existing || new Date(article.publishedAt) < new Date(existing.publishedAt)) {
      seen.set(key, article);
    }
  }
  return Array.from(seen.values());
}

export async function rankByImportance(
  articles: RawArticle[],
  trustScoreBySource: Record<string, number> = {},
): Promise<RawArticle[]> {
  return [...articles].sort((a, b) => {
    const trustDelta = (trustScoreBySource[b.sourceId] ?? 50) - (trustScoreBySource[a.sourceId] ?? 50);
    if (trustDelta !== 0) return trustDelta;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export * from "./ingest";
