import { Worker } from "bullmq";

/**
 * Consumes match-event and breaking-news jobs, filters by each user's
 * notification_preferences, and dispatches push via @vyntro/svc-notifications.
 * Implemented in Phase 7.
 */
const worker = new Worker(
  "notification-dispatcher",
  async (_job) => {
    throw new Error("Not implemented");
  },
  { connection: { url: process.env.REDIS_URL } },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});
