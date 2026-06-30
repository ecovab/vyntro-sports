import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";

@Controller()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get("favorites")
  list() {
    return this.favoritesService.list("TODO");
  }

  @Post("favorites")
  add(@Body() body: { subjectType: string; subjectId: string }) {
    return this.favoritesService.add("TODO", body.subjectType, body.subjectId);
  }

  @Delete("favorites/:id")
  remove(@Param("id") id: string) {
    return this.favoritesService.remove("TODO", id);
  }

  @Get("feed")
  feed() {
    return this.favoritesService.getFeed("TODO");
  }
}
