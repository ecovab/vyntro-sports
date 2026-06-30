import type { MatchStatus, Sport } from "@vyntro/types";

export interface NormalizedCompetition {
  externalRef: string;
  name: string;
  slug: string;
  country?: string;
  season?: string;
  tierWeight?: number;
}

export interface NormalizedTeam {
  externalRef: string;
  name: string;
  shortName?: string;
  country?: string;
  logoUrl?: string;
}

export interface NormalizedMatch {
  externalRef: string;
  competition: NormalizedCompetition;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  status: MatchStatus;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  raw?: unknown;
}

export interface NormalizedStanding {
  team: NormalizedTeam;
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
}

/**
 * Every sports-data provider (API-Football, Sportradar, SportMonks, ...) implements
 * this interface so new sports/providers plug in without touching domain logic.
 * Implementations must only return data verified by the provider — never fabricate
 * scores, events, or fixtures.
 */
export interface SportsDataAdapter {
  readonly sport: Sport;
  fetchLiveMatches(): Promise<NormalizedMatch[]>;
  fetchFixtures(competitionExternalRef: string): Promise<NormalizedMatch[]>;
  fetchStandings(competitionExternalRef: string): Promise<NormalizedStanding[]>;
}
