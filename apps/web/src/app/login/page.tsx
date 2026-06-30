"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, GlassCard, Input } from "@vyntro/ui";
import { apiClient } from "../../lib/api";
import { useAuthStore } from "../../store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user, tokens } = await apiClient.login(email, password);
      setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="mb-6 text-2xl font-bold text-white">Log in</h1>
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </GlassCard>
      <p className="mt-4 text-sm text-white/50">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-white underline">
          Sign up
        </a>
      </p>
    </main>
  );
}
