import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@vyntro/types";

interface AdminAuthState {
  accessToken: string | null;
  admin: UserProfile | null;
  setSession: (session: { accessToken: string; admin: UserProfile }) => void;
  clearSession: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      admin: null,
      setSession: ({ accessToken, admin }) => set({ accessToken, admin }),
      clearSession: () => set({ accessToken: null, admin: null }),
    }),
    { name: "vyntro-admin-auth" },
  ),
);
