import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  // Implemented in Phase 7: dispatch worker writes notifications, this reads/manages them
  async list(_userId: string) {
    return [];
  }

  async markRead(_userId: string, _id: string) {
    return null;
  }

  async getPreferences(_userId: string) {
    return [];
  }

  async updatePreferences(_userId: string, _prefs: unknown) {
    return null;
  }

  async registerDevice(_userId: string, _token: string, _platform: "ios" | "android" | "web") {
    return null;
  }
}
