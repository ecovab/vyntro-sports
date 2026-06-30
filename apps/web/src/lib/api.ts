import { VyntroClient } from "@vyntro/sdk";
import { useAuthStore } from "../store/auth";

export const apiClient = new VyntroClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  getAccessToken: () => useAuthStore.getState().accessToken ?? undefined,
});
