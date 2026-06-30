import { prisma } from "@vyntro/db";
import type { RawArticle } from "./index";

/**
 * Persists deduped/ranked articles. Relies on the unique constraint on
 * NewsArticle.url for idempotency — re-ingesting the same article is a no-op.
 */
export async function ingestNewsArticles(articles: RawArticle[]) {
  let ingested = 0;
  for (const article of articles) {
    const existing = await prisma.newsArticle.findUnique({ where: { url: article.sourceUrl } });
    if (existing) continue;

    await prisma.newsArticle.create({
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
    ingested += 1;
  }
  return { ingested };
}
