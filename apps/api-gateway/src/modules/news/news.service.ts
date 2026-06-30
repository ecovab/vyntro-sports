import { Injectable } from "@nestjs/common";

@Injectable()
export class NewsService {
  // Implemented in Phase 5: reads deduped/ranked articles populated by news ingestion worker
  async list(_filters: { sport?: string; category?: string; page?: number }) {
    return [];
  }

  async getById(_id: string) {
    return null;
  }

  async breaking() {
    return [];
  }
}
