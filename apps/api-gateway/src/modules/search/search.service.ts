import { Injectable } from "@nestjs/common";

@Injectable()
export class SearchService {
  // Fans out to matches/teams/players/competitions/news; predictive/typeahead in Phase 5+
  async search(_query: string) {
    return { matches: [], teams: [], players: [], competitions: [], news: [] };
  }
}
