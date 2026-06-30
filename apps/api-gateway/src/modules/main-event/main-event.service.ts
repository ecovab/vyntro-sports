import { Injectable } from "@nestjs/common";
import { prisma } from "@vyntro/db";
import { cacheWrap } from "@vyntro/cache";

@Injectable()
export class MainEventService {
  /**
   * The current MAIN EVENT is selected by the trending-scorer worker (every
   * 15s, via computeImportanceScore) and persisted to the MainEvent table —
   * this service only reads that decision and hydrates it, never re-derives
   * its own selection.
   *
   * Cached for 5s: this is the most-polled read in the app (every client's
   * hero), so a short cache-aside window meaningfully cuts DB load. The
   * trending-scorer worker also pre-warms this same key on every scoring
   * pass, so reads are almost always served fresh from cache.
   */
  async getCurrent() {
    return cacheWrap("main-event:current", 5, () => this.computeCurrent());
  }

  private async computeCurrent() {
    const current = await prisma.mainEvent.findFirst({ where: { endedAt: null }, orderBy: { startedAt: "desc" } });
    if (!current) {
      return null;
    }

    if (current.matchId) {
      const match = await prisma.match.findUnique({
        where: { id: current.matchId },
        include: { sport: true, competition: true, homeTeam: true, awayTeam: true },
      });
      if (!match) return null;
      return {
        id: current.id,
        matchId: match.id,
        articleId: null,
        score: current.score,
        startedAt: (match.startedAt ?? match.scheduledAt).toISOString(),
        match,
      };
    }

    if (current.articleId) {
      const article = await prisma.newsArticle.findUnique({
        where: { id: current.articleId },
        include: { source: true },
      });
      if (!article) return null;
      return {
        id: current.id,
        matchId: null,
        articleId: article.id,
        score: current.score,
        startedAt: article.publishedAt.toISOString(),
        article,
      };
    }

    return null;
  }

  async getHistory() {
    return prisma.mainEvent.findMany({ orderBy: { startedAt: "desc" }, take: 20 });
  }
}
