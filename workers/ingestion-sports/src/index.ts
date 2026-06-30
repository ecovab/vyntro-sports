import { Worker } from "bullmq";

/**
 * Polls each registered SportsDataAdapter on an interval, normalizes results,
 * and upserts matches/events into Postgres. Implemented in Phase 5.
 */
const worker = new Worker(
  "ingestion-sports",
  async (_job) => {
    throw new Error("Not implemented");
  },
  { connection: { url: process.env.REDIS_URL } },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
