import { VyntroClient } from "@vyntro/sdk";
import { useAdminAuthStore } from "../store/auth";

export const apiClient = new VyntroClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  getAccessToken: () => useAdminAuthStore.getState().accessToken ?? undefined,
});
