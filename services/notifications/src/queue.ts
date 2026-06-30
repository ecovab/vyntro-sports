import { Queue } from "bullmq";
import type { NotificationEvent } from "./index";

let queue: Queue<NotificationEvent> | undefined;

function getQueue(): Queue<NotificationEvent> {
  if (!queue) {
    queue = new Queue<NotificationEvent>("notification-dispatcher", {
      connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
    });
  }
  return queue;
}

export async function enqueueNotificationEvent(event: NotificationEvent): Promise<void> {
  await getQueue().add(event.eventType, event, { removeOnComplete: true, removeOnFail: 50 });
}
