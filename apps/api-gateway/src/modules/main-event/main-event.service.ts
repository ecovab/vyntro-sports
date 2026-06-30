import { Injectable } from "@nestjs/common";
import { prisma } from "@vyntro/db";
import { cacheWrap } from "@vyntro/cache";

@Injectable()
export class MainEventService {
  /**
   * Phase 5 selection: the live match in the highest-tier competition.
   * A dedicated trending-scorer worker (Phase 7) will replace this with a
   * real engagement-weighted score; until then this is a deterministic,
   * verifiable placeholder — never a fabricated or guessed match.
   *
   * Cached for 5s: this is the most-polled read in the app (every client's
   * hero), so a short cache-aside window meaningfully cuts DB load without
   * making the hero noticeably stale.
   */
  async getCurrent() {
    return cacheWrap("main-event:current", 5, () => this.computeCurrent());
  }

  private async computeCurrent() {
    const liveMatch = await prisma.match.findFirst({
      where: { status: "live" },
      include: { sport: true, competition: true, homeTeam: true, awayTeam: true },
      orderBy: { competition: { tierWeight: "desc" } },
    });

    if (liveMatch) {
      return {
        id: liveMatch.id,
        matchId: liveMatch.id,
        articleId: null,
        score: liveMatch.competition.tierWeight,
        startedAt: (liveMatch.startedAt ?? liveMatch.scheduledAt).toISOString(),
        match: liveMatch,
      };
    }

    const breakingArticle = await prisma.newsArticle.findFirst({
      orderBy: { publishedAt: "desc" },
      include: { source: true },
    });

    if (breakingArticle) {
      return {
        id: breakingArticle.id,
        matchId: null,
        articleId: breakingArticle.id,
        score: 0,
        startedAt: breakingArticle.publishedAt.toISOString(),
        article: breakingArticle,
      };
    }

    return null;
  }

  async getHistory() {
    return prisma.mainEvent.findMany({ orderBy: { startedAt: "desc" }, take: 20 });
  }
}
