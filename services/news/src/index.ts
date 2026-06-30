export interface RawArticle {
  sourceUrl: string;
  title: string;
  content: string;
  publishedAt: string;
}

/**
 * Dedup via title/content similarity (embedding or hashing) before persisting.
 * Implemented in Phase 5.
 */
export async function deduplicateArticles(articles: RawArticle[]): Promise<RawArticle[]> {
  return articles;
}

export async function rankByImportance(articles: RawArticle[]): Promise<RawArticle[]> {
  return articles;
}
