import type { MatchSummary } from "@vyntro/types";
import type { SportsDataAdapter } from "./SportsDataAdapter";

export class FootballAdapter implements SportsDataAdapter {
  readonly sport = "football" as const;

  async fetchLiveMatches(): Promise<MatchSummary[]> {
    // Implemented in Phase 5: call provider API, normalize into MatchSummary[]
    return [];
  }

  async fetchFixtures(_competitionId: string): Promise<MatchSummary[]> {
    return [];
  }

  async fetchStandings(_competitionId: string): Promise<unknown> {
    return [];
  }
}
