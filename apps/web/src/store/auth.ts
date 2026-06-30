import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@vyntro/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  setSession: (session: { accessToken: string; refreshToken: string; user: UserProfile }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "vyntro-auth" },
  ),
);
