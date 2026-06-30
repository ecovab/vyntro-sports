import { Worker } from "bullmq";

/**
 * Runs continuously: scores all live/upcoming events via
 * computeImportanceScore, writes the top score to main_event + Redis cache,
 * and broadcasts main_event.changed over the WS pub/sub channel.
 * Implemented in Phase 6.
 */
const worker = new Worker(
  "trending-scorer",
  async (_job) => {
    throw new Error("Not implemented");
  },
  { connection: { url: process.env.REDIS_URL } },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
