import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";
import { FavoritesService } from "./favorites.service";

@Controller()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get("favorites")
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.list(user.id);
  }

  @Post("favorites")
  add(@CurrentUser() user: AuthenticatedUser, @Body() body: { subjectType: string; subjectId: string }) {
    return this.favoritesService.add(user.id, body.subjectType, body.subjectId);
  }

  @Delete("favorites/:id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.favoritesService.remove(user.id, id);
  }

  @Get("feed")
  feed(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.getFeed(user.id);
  }
}
