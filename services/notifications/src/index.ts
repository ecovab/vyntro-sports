import { prisma } from "@vyntro/db";
import { sendFcmPush } from "./fcm";
import { sendApnsPush } from "./apns";

export * from "./queue";

export interface PushTarget {
  userId: string;
  deviceToken: string;
  platform: "ios" | "android" | "web";
}

/** Dispatches a single push via the provider appropriate for the device's platform. */
export async function dispatchPush(target: PushTarget, title: string, body: string): Promise<void> {
  const result =
    target.platform === "ios"
      ? await sendApnsPush(target.deviceToken, title, body)
      : await sendFcmPush(target.deviceToken, title, body);

  if (!result.success) {
    throw new Error(`Push dispatch failed for ${target.platform} device: ${result.error}`);
  }
}

export interface NotificationEvent {
  eventType: string;
  sportId?: string;
  subjectType?: string;
  subjectId?: string;
  title: string;
  body: string;
}

interface PreferenceRow {
  sportId: string;
  enabled: boolean;
}

interface FavoriteRow {
  userId: string;
}

interface DeviceRow {
  token: string;
  platform: string;
}

/** "" is the sentinel for an "all sports" preference row (see @@unique constraint on NotificationPreference). */
async function isEnabled(userId: string, sportId: string | undefined, eventType: string): Promise<boolean> {
  const prefs: PreferenceRow[] = await prisma.notificationPreference.findMany({
    where: {
      userId,
      eventType,
      sportId: { in: [sportId ?? "", ""] },
    },
  });
  if (prefs.length === 0) return true; // default opt-in until the user sets a preference
  const sportSpecific = prefs.find((p) => p.sportId === (sportId ?? ""));
  return (sportSpecific ?? prefs[0]).enabled;
}

/**
 * Fans an event out to every user who favorited the subject (or follows the
 * sport) and has the relevant notification preference enabled. Writes a
 * Notification row per recipient regardless of push delivery outcome, so the
 * in-app notification center always reflects what was decided to be sent.
 */
export async function notifyUsersForEvent(event: NotificationEvent): Promise<{ notified: number }> {
  const [subjectFavorites, sportFollowers]: [FavoriteRow[], FavoriteRow[]] = await Promise.all([
    event.subjectId
      ? prisma.favorite.findMany({ where: { subjectType: event.subjectType, subjectId: event.subjectId } })
      : Promise.resolve([]),
    event.sportId
      ? prisma.favorite.findMany({ where: { subjectType: "sport", subjectId: event.sportId } })
      : Promise.resolve([]),
  ]);

  const candidateUserIds = Array.from(
    new Set([...subjectFavorites.map((r) => r.userId), ...sportFollowers.map((r) => r.userId)]),
  );
  let notified = 0;

  for (const userId of candidateUserIds) {
    const enabled = await isEnabled(userId, event.sportId, event.eventType);
    if (!enabled) continue;

    await prisma.notification.create({
      data: {
        userId,
        title: event.title,
        body: event.body,
        subjectType: event.subjectType,
        subjectId: event.subjectId,
      },
    });

    const devices: DeviceRow[] = await prisma.device.findMany({ where: { userId } });
    await Promise.allSettled(
      devices.map((device) =>
        dispatchPush(
          { userId, deviceToken: device.token, platform: device.platform as PushTarget["platform"] },
          event.title,
          event.body,
        ),
      ),
    );

    notified += 1;
  }

  return { notified };
}
