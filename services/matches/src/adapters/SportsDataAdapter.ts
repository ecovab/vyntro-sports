import type { MatchSummary, Sport } from "@vyntro/types";

/**
 * Every sports-data provider (API-Football, Sportradar, SportMonks, ...) implements
 * this interface so new sports/providers plug in without touching domain logic.
 */
export interface SportsDataAdapter {
  readonly sport: Sport;
  fetchLiveMatches(): Promise<MatchSummary[]>;
  fetchFixtures(competitionId: string): Promise<MatchSummary[]>;
  fetchStandings(competitionId: string): Promise<unknown>;
}
