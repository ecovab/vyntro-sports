import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";
import { AdminService } from "./admin.service";

@Roles("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch("users/:id")
  updateUser(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string, @Body() patch: unknown) {
    return this.adminService.updateUser(admin.id, id, patch as Parameters<AdminService["updateUser"]>[2]);
  }

  @Get("subscriptions")
  listSubscriptions() {
    return this.adminService.listSubscriptions();
  }

  @Get("analytics")
  analytics() {
    return this.adminService.getAnalytics();
  }

  @Get("logs")
  logs() {
    return this.adminService.getLogs();
  }

  @Get("feature-flags")
  featureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Patch("feature-flags/:key")
  updateFeatureFlag(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("key") key: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.adminService.updateFeatureFlag(admin.id, key, body.enabled);
  }
}
