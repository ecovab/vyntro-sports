"use client";

import Link from "next/link";
import { Button } from "@vyntro/ui";
import { useAuthStore } from "../store/auth";

export function Navbar() {
  const { user, clearSession } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          VYNTRO <span className="text-white/40">SPORTS</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-white/60">{user.displayName ?? user.email}</span>
              <Button variant="ghost" onClick={clearSession}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
