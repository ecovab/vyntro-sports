import { Injectable } from "@nestjs/common";

@Injectable()
export class MatchesService {
  // Implemented in Phase 5: reads from Postgres, populated by ingestion workers
  async listMatches(_filters: { sport?: string; competition?: string; status?: string; date?: string }) {
    return [];
  }

  async getMatchById(_id: string) {
    return null;
  }

  async getStandings(_competitionId: string) {
    return [];
  }
}
