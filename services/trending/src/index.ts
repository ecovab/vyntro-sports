import { prisma } from "@vyntro/db";

export interface ImportanceComponents {
  tierWeight: number;
  liveVolatility: number;
  newsVolume: number;
  socialSignal: number;
}

/**
 * Scoring formula for MAIN EVENT selection — weights are tunable config,
 * not hardcoded business logic, so the formula can evolve without redeploys
 * once Phase 6 wires this to admin feature flags.
 */
export function computeImportanceScore(components: ImportanceComponents): number {
  const { tierWeight, liveVolatility, newsVolume, socialSignal } = components;
  return tierWeight * 0.4 + liveVolatility * 0.3 + newsVolume * 0.2 + socialSignal * 0.1;
}

const NEWS_VOLUME_WINDOW_MS = 24 * 60 * 60 * 1000;
const VOLATILITY_EVENT_TYPES = new Set(["goal", "red_card", "yellow_card", "penalty"]);

interface LiveMatchRow {
  id: string;
  sportId: string;
  competition: { tierWeight: number };
  events: Array<{ type: string }>;
}

export interface MainEventCandidate {
  matchId: string | null;
  articleId: string | null;
  score: number;
}

/**
 * Picks the single highest-importance live/upcoming event right now.
 * Reads only facts already persisted by ingestion workers — never invents
 * a match, score, or article. Falls back to the most recent news article
 * when nothing is live, so the hero is never empty without being fabricated.
 */
export async function selectMainEvent(): Promise<MainEventCandidate | null> {
  const liveMatches: LiveMatchRow[] = await prisma.match.findMany({
    where: { status: "live" },
    include: { competition: true, events: true },
  });

  if (liveMatches.length > 0) {
    const sportIds = Array.from(new Set(liveMatches.map((m) => m.sportId)));
    const newsCounts = await Promise.all(
      sportIds.map((sportId) =>
        prisma.newsArticle.count({
          where: { sportId, publishedAt: { gte: new Date(Date.now() - NEWS_VOLUME_WINDOW_MS) } },
        }),
      ),
    );
    const newsVolumeBySport = new Map(sportIds.map((id, i) => [id, newsCounts[i]]));

    let best: { matchId: string; score: number } | null = null;
    for (const match of liveMatches) {
      const liveVolatility = match.events.filter((e) => VOLATILITY_EVENT_TYPES.has(e.type)).length;
      const newsVolume = newsVolumeBySport.get(match.sportId) ?? 0;
      const score = computeImportanceScore({
        tierWeight: match.competition.tierWeight,
        liveVolatility,
        newsVolume,
        // No social-signal ingestion pipeline exists yet — never fabricated, always 0 until one does.
        socialSignal: 0,
      });
      if (!best || score > best.score) {
        best = { matchId: match.id, score };
      }
    }
    if (best) {
      return { matchId: best.matchId, articleId: null, score: best.score };
    }
  }

  const breakingArticle = await prisma.newsArticle.findFirst({ orderBy: { publishedAt: "desc" } });
  if (breakingArticle) {
    return { matchId: null, articleId: breakingArticle.id, score: 0 };
  }

  return null;
}
