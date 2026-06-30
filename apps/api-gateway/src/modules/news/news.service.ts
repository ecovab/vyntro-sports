import { Injectable } from "@nestjs/common";
import { prisma } from "@vyntro/db";

const PAGE_SIZE = 20;
const BREAKING_WINDOW_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class NewsService {
  async list(filters: { sport?: string; category?: string; page?: number }) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const where: Record<string, unknown> = {};
    if (filters.sport) {
      const sport = await prisma.sport.findUnique({ where: { slug: filters.sport } });
      where.sportId = sport?.id ?? "__no_match__";
    }

    return prisma.newsArticle.findMany({
      where,
      include: { source: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  }

  async getById(id: string) {
    const article = await prisma.newsArticle.findUnique({ where: { id }, include: { source: true } });
    if (!article) return null;

    const aiSummary = await prisma.aiSummary.findUnique({
      where: { subjectType_subjectId: { subjectType: "article", subjectId: id } },
    });
    return { ...article, aiSummary: aiSummary?.summaryText ?? null };
  }

  async breaking() {
    return prisma.newsArticle.findMany({
      where: { publishedAt: { gte: new Date(Date.now() - BREAKING_WINDOW_MS) } },
      include: { source: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
    });
  }
}
