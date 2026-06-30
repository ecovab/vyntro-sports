import { Injectable } from "@nestjs/common";
import { prisma } from "@vyntro/db";

interface PreferenceInput {
  sportId?: string;
  eventType: string;
  channel: string;
  enabled: boolean;
}

@Injectable()
export class NotificationsService {
  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: "desc" },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async getPreferences(userId: string) {
    return prisma.notificationPreference.findMany({ where: { userId } });
  }

  /** sportId omitted/empty means an "all sports" preference (sentinel value ""). */
  async updatePreferences(userId: string, prefs: PreferenceInput[]) {
    return Promise.all(
      prefs.map((pref) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_sportId_eventType_channel: {
              userId,
              sportId: pref.sportId ?? "",
              eventType: pref.eventType,
              channel: pref.channel,
            },
          },
          update: { enabled: pref.enabled },
          create: {
            userId,
            sportId: pref.sportId ?? "",
            eventType: pref.eventType,
            channel: pref.channel,
            enabled: pref.enabled,
          },
        }),
      ),
    );
  }

  async registerDevice(userId: string, token: string, platform: "ios" | "android" | "web") {
    return prisma.device.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }
}
