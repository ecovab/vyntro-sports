import type { MatchStatus } from "@vyntro/types";
import type { NormalizedMatch, NormalizedStanding, SportsDataAdapter } from "./SportsDataAdapter";

const API_BASE = "https://api.football-data.org/v4";

interface ProviderTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  area?: { name?: string };
}

interface ProviderCompetition {
  id: number;
  name: string;
  code?: string;
  area?: { name?: string };
}

interface ProviderMatch {
  id: number;
  utcDate: string;
  status: string;
  venue?: string;
  competition: ProviderCompetition;
  homeTeam: ProviderTeam;
  awayTeam: ProviderTeam;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
  season?: { id: number };
}

interface ProviderStandingTable {
  position: number;
  team: ProviderTeam;
  points: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
}

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  POSTPONED: "postponed",
  SUSPENDED: "postponed",
  CANCELLED: "postponed",
};

function mapTeam(team: ProviderTeam) {
  return {
    externalRef: String(team.id),
    name: team.name,
    shortName: team.shortName ?? team.tla,
    country: team.area?.name,
    logoUrl: team.crest,
  };
}

function mapMatch(match: ProviderMatch): NormalizedMatch {
  return {
    externalRef: String(match.id),
    competition: {
      externalRef: String(match.competition.id),
      name: match.competition.name,
      slug: (match.competition.code ?? match.competition.name).toLowerCase().replace(/\s+/g, "-"),
      country: match.competition.area?.name,
      season: match.season ? String(match.season.id) : undefined,
    },
    homeTeam: mapTeam(match.homeTeam),
    awayTeam: mapTeam(match.awayTeam),
    status: STATUS_MAP[match.status] ?? "scheduled",
    scheduledAt: match.utcDate,
    venue: match.venue,
    homeScore: match.score.fullTime.home ?? undefined,
    awayScore: match.score.fullTime.away ?? undefined,
    raw: match,
  };
}

export class FootballAdapter implements SportsDataAdapter {
  readonly sport = "football" as const;

  private async request<T>(path: string): Promise<T> {
    const apiKey = process.env.SPORTS_DATA_API_KEY;
    if (!apiKey) {
      throw new Error("SPORTS_DATA_API_KEY is not configured");
    }
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "X-Auth-Token": apiKey },
    });
    if (!response.ok) {
      throw new Error(`football-data.org request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }

  async fetchLiveMatches(): Promise<NormalizedMatch[]> {
    const data = await this.request<{ matches: ProviderMatch[] }>("/matches?status=LIVE,IN_PLAY,PAUSED");
    return data.matches.map(mapMatch);
  }

  async fetchFixtures(competitionExternalRef: string): Promise<NormalizedMatch[]> {
    const data = await this.request<{ matches: ProviderMatch[] }>(
      `/competitions/${competitionExternalRef}/matches?status=SCHEDULED,TIMED`,
    );
    return data.matches.map(mapMatch);
  }

  async fetchStandings(competitionExternalRef: string): Promise<NormalizedStanding[]> {
    const data = await this.request<{ standings: Array<{ type: string; table: ProviderStandingTable[] }> }>(
      `/competitions/${competitionExternalRef}/standings`,
    );
    const overall = data.standings.find((s) => s.type === "TOTAL") ?? data.standings[0];
    if (!overall) return [];
    return overall.table.map((row) => ({
      team: mapTeam(row.team),
      rank: row.position,
      points: row.points,
      played: row.playedGames,
      won: row.won,
      drawn: row.draw,
      lost: row.lost,
    }));
  }
}
