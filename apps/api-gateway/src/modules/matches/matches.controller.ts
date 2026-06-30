import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { MatchesService } from "./matches.service";

@Public()
@Controller("sports")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get("matches")
  list(@Query() query: { sport?: string; competition?: string; status?: string; date?: string }) {
    return this.matchesService.listMatches(query);
  }

  @Get("matches/:id")
  getOne(@Param("id") id: string) {
    return this.matchesService.getMatchById(id);
  }

  @Get("standings")
  standings(@Query("competition") competitionId: string) {
    return this.matchesService.getStandings(competitionId);
  }
}
