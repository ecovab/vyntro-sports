import { prisma } from "@vyntro/db";
import type { RawArticle } from "./index";

/**
 * Persists deduped/ranked articles. Relies on the unique constraint on
 * NewsArticle.url for idempotency — re-ingesting the same article is a no-op.
 */
export async function ingestNewsArticles(articles: RawArticle[]) {
  const created: Array<{ id: string; title: string; content?: string; sportId?: string }> = [];
  for (const article of articles) {
    const existing = await prisma.newsArticle.findUnique({ where: { url: article.sourceUrl } });
    if (existing) continue;

    const row = await prisma.newsArticle.create({
      data: {
        sourceId: article.sourceId,
        sportId: article.sportId,
        title: article.title,
        url: article.sourceUrl,
        publishedAt: new Date(article.publishedAt),
        rawContent: article.content,
        imageUrl: article.imageUrl,
      },
    });
    created.push({ id: row.id, title: article.title, content: article.content, sportId: article.sportId });
  }
  return { ingested: created.length, articles: created };
}
