import { Worker } from "bullmq";
import { notifyUsersForEvent, type NotificationEvent } from "@vyntro/svc-notifications";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

/**
 * Consumes match-event and breaking-news jobs enqueued by the ingestion
 * workers, filters by each user's notification_preferences, and dispatches
 * push via @vyntro/svc-notifications.
 */
const worker = new Worker<NotificationEvent>(
  "notification-dispatcher",
  async (job) => notifyUsersForEvent(job.data),
  { connection },
);

worker.on("completed", (job, result) => {
  console.log(`[notification-dispatcher] ${job.data.eventType}: notified ${result.notified} user(s)`);
});

worker.on("failed", (job, err) => {
  console.error(`[notification-dispatcher] job ${job?.id} (${job?.data.eventType}) failed`, err);
});
