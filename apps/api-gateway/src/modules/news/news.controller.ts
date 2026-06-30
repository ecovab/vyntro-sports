import { Controller, Get, Param, Query } from "@nestjs/common";
import { NewsService } from "./news.service";

@Controller("news")
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  list(@Query() query: { sport?: string; category?: string; page?: number }) {
    return this.newsService.list(query);
  }

  @Get("breaking")
  breaking() {
    return this.newsService.breaking();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.newsService.getById(id);
  }
}
