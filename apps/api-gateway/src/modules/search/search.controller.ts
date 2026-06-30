import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { SearchService } from "./search.service";

@Public()
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query("q") query: string) {
    return this.searchService.search(query);
  }
}
