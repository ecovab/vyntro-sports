import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("notifications")
  list() {
    return this.notificationsService.list("TODO");
  }

  @Patch("notifications/:id/read")
  markRead(@Param("id") id: string) {
    return this.notificationsService.markRead("TODO", id);
  }

  @Get("notification-preferences")
  getPreferences() {
    return this.notificationsService.getPreferences("TODO");
  }

  @Patch("notification-preferences")
  updatePreferences(@Body() body: unknown) {
    return this.notificationsService.updatePreferences("TODO", body);
  }

  @Post("devices")
  registerDevice(@Body() body: { token: string; platform: "ios" | "android" | "web" }) {
    return this.notificationsService.registerDevice("TODO", body.token, body.platform);
  }
}
