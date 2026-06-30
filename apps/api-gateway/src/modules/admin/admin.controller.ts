import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch("users/:id")
  updateUser(@Param("id") id: string, @Body() patch: unknown) {
    return this.adminService.updateUser(id, patch);
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
  updateFeatureFlag(@Param("key") key: string, @Body() body: { enabled: boolean }) {
    return this.adminService.updateFeatureFlag(key, body.enabled);
  }
}
