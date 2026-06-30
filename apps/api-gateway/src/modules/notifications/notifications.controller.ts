import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("notifications")
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.list(user.id);
  }

  @Patch("notifications/:id/read")
  markRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Get("notification-preferences")
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch("notification-preferences")
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.notificationsService.updatePreferences(user.id, body);
  }

  @Post("devices")
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() body: { token: string; platform: "ios" | "android" | "web" }) {
    return this.notificationsService.registerDevice(user.id, body.token, body.platform);
  }
}
