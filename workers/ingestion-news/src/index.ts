import { Queue, Worker } from "bullmq";
import Parser from "rss-parser";
import { prisma } from "@vyntro/db";
import { deduplicateArticles, ingestNewsArticles, rankByImportance, type RawArticle } from "@vyntro/svc-news";
import { getOrGenerateArticleSummary } from "@vyntro/svc-ai-orchestrator";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const POLL_INTERVAL_MS = 60_000;
const parser = new Parser();

const queue = new Queue("ingestion-news", { connection });

interface NewsSourceRow {
  id: string;
  url: string;
  trustScore: number;
}

async function fetchSourceArticles(source: NewsSourceRow): Promise<RawArticle[]> {
  const feed = await parser.parseURL(source.url);
  return feed.items
    .filter((item) => item.link && item.title && (item.isoDate || item.pubDate))
    .map((item) => ({
      sourceUrl: item.link as string,
      sourceId: source.id,
      title: item.title as string,
      content: item.contentSnippet ?? item.content,
      imageUrl: item.enclosure?.url,
      publishedAt: new Date(item.isoDate ?? item.pubDate ?? Date.now()).toISOString(),
    }));
}

const worker = new Worker(
  "ingestion-news",
  async () => {
    const sources: NewsSourceRow[] = await prisma.newsSource.findMany();
    const trustScoreBySource = Object.fromEntries(sources.map((s) => [s.id, s.trustScore]));

    const fetched = await Promise.allSettled(sources.map((source) => fetchSourceArticles(source)));
    const articles = fetched.flatMap((result) =>
      result.status === "fulfilled" ? result.value : ([] as RawArticle[]),
    );

    const deduped = await deduplicateArticles(articles);
    const ranked = await rankByImportance(deduped, trustScoreBySource);
    const result = await ingestNewsArticles(ranked);

    await Promise.allSettled(
      result.articles.map((article) =>
        getOrGenerateArticleSummary(article.id, article.title, article.content ?? "").catch((err) =>
          console.error(`[ingestion-news] summary generation failed for article ${article.id}`, err),
        ),
      ),
    );

    return { ingested: result.ingested };
  },
  { connection },
);

worker.on("completed", (job, result) => {
  console.log(`[ingestion-news] ingested ${result.ingested} new article(s)`);
});

worker.on("failed", (job, err) => {
  console.error(`[ingestion-news] job ${job?.id} failed`, err);
});

queue
  .add(
    "poll-news-sources",
    {},
    { repeat: { every: POLL_INTERVAL_MS }, jobId: "poll-news-sources", removeOnComplete: true, removeOnFail: 50 },
  )
  .catch((err) => {
    console.error("[ingestion-news] failed to schedule recurring job", err);
  });
