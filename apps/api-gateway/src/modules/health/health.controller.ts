import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { prisma } from "@vyntro/db";
import { Public } from "../../common/decorators/public.decorator";

@Controller("health")
export class HealthController {
  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "up" };
    } catch {
      throw new ServiceUnavailableException({ status: "error", db: "down" });
    }
  }
}
