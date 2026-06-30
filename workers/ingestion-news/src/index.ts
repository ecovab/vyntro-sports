import { Worker } from "bullmq";

/**
 * Polls news sources/RSS, dedups via @vyntro/svc-news, persists articles.
 * Implemented in Phase 5.
 */
const worker = new Worker(
  "ingestion-news",
  async (_job) => {
    throw new Error("Not implemented");
  },
  { connection: { url: process.env.REDIS_URL } },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
