"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, GlassCard, Input } from "@vyntro/ui";
import { apiClient } from "../../lib/api";
import { useAuthStore } from "../../store/auth";

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user, tokens } = await apiClient.signup(email, password, displayName || undefined);
      setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="mb-6 text-2xl font-bold text-white">Create your account</h1>
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>
      </GlassCard>
      <p className="mt-4 text-sm text-white/50">
        Already have an account?{" "}
        <a href="/login" className="text-white underline">
          Log in
        </a>
      </p>
    </main>
  );
}
