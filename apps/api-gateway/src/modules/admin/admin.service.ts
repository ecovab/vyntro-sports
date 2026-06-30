import { Injectable } from "@nestjs/common";
import { prisma } from "@vyntro/db";
import type { UserRole } from "@vyntro/db";

interface UserPatch {
  role?: UserRole;
  status?: string;
  displayName?: string;
}

@Injectable()
export class AdminService {
  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async updateUser(adminId: string, id: string, patch: UserPatch) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        role: patch.role,
        status: patch.status,
        displayName: patch.displayName,
      },
    });

    await prisma.adminAuditLog.create({
      data: { adminId, action: "user.update", targetType: "user", targetId: id, metadata: patch },
    });

    return user;
  }

  async listSubscriptions() {
    return prisma.subscription.findMany({
      include: { user: { select: { id: true, email: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async getAnalytics() {
    const [totalUsers, premiumSubscriptions, liveMatches, articlesLast24h] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: "active", plan: { not: "free" } } }),
      prisma.match.count({ where: { status: "live" } }),
      prisma.newsArticle.count({ where: { publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);

    return { totalUsers, premiumSubscriptions, liveMatches, articlesLast24h };
  }

  async getLogs() {
    return prisma.adminAuditLog.findMany({
      include: { admin: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async getFeatureFlags() {
    return prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async updateFeatureFlag(adminId: string, key: string, enabled: boolean) {
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled },
      create: { key, enabled },
    });

    await prisma.adminAuditLog.create({
      data: { adminId, action: "feature-flag.update", targetType: "feature-flag", targetId: key, metadata: { enabled } },
    });

    return flag;
  }
}
