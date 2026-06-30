import { Injectable } from "@nestjs/common";

@Injectable()
export class FavoritesService {
  async list(_userId: string) {
    return [];
  }

  async add(_userId: string, _subjectType: string, _subjectId: string) {
    return null;
  }

  async remove(_userId: string, _id: string) {
    return null;
  }

  // Personalized homepage built from favorites + trending scores
  async getFeed(_userId: string) {
    return [];
  }
}
