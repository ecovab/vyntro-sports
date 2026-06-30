import { Injectable } from "@nestjs/common";

@Injectable()
export class AdminService {
  // Implemented in Phase 9, guarded by RBAC (admin role only)
  async listUsers() {
    return [];
  }

  async updateUser(_id: string, _patch: unknown) {
    return null;
  }

  async listSubscriptions() {
    return [];
  }

  async getAnalytics() {
    return {};
  }

  async getLogs() {
    return [];
  }

  async getFeatureFlags() {
    return [];
  }

  async updateFeatureFlag(_key: string, _enabled: boolean) {
    return null;
  }
}
