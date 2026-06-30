"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../lib/api";
import { useAdminAuthStore } from "../../store/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.login(email, password);
      if (res.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }
      setSession({ accessToken: res.tokens.accessToken, admin: res.user });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 360 }}>
      <h1>Vyntro Sports Admin</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
