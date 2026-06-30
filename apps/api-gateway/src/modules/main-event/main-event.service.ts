import { Injectable } from "@nestjs/common";

@Injectable()
export class MainEventService {
  // Implemented in Phase 5/6: reads current slot from Redis, written by trending-scorer worker
  async getCurrent() {
    return null;
  }

  async getHistory() {
    return [];
  }
}
