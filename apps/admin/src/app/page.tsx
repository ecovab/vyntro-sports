"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminAnalytics, AdminFeatureFlag, AdminSubscription, AdminUser } from "@vyntro/sdk";
import { apiClient } from "../lib/api";
import { useAdminAuthStore } from "../store/auth";

export default function AdminHome() {
  const router = useRouter();
  const { accessToken, admin, clearSession } = useAdminAuthStore();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [flags, setFlags] = useState<AdminFeatureFlag[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    Promise.all([
      apiClient.adminGetAnalytics(),
      apiClient.adminListUsers(),
      apiClient.adminListSubscriptions(),
      apiClient.adminGetFeatureFlags(),
    ])
      .then(([analyticsRes, usersRes, subsRes, flagsRes]) => {
        setAnalytics(analyticsRes);
        setUsers(usersRes);
        setSubscriptions(subsRes);
        setFlags(flagsRes);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load admin data"));
  }, [accessToken, router]);

  async function toggleFlag(key: string, enabled: boolean) {
    const updated = await apiClient.adminUpdateFeatureFlag(key, !enabled);
    setFlags((prev) => prev.map((f) => (f.key === key ? updated : f)));
  }

  async function updateUserRole(id: string, role: AdminUser["role"]) {
    const updated = await apiClient.adminUpdateUser(id, { role });
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }

  if (!accessToken) return null;

  return (
    <main style={{ padding: 40 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Vyntro Sports Admin</h1>
        <div>
          <span style={{ marginRight: 16 }}>{admin?.email}</span>
          <button onClick={() => clearSession()}>Sign out</button>
        </div>
      </header>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      <section style={{ marginTop: 32 }}>
        <h2>Overview</h2>
        {analytics ? (
          <div style={{ display: "flex", gap: 24 }}>
            <Stat label="Total users" value={analytics.totalUsers} />
            <Stat label="Premium subscriptions" value={analytics.premiumSubscriptions} />
            <Stat label="Live matches" value={analytics.liveMatches} />
            <Stat label="Articles (24h)" value={analytics.articlesLast24h} />
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Users</h2>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value as AdminUser["role"])}>
                    <option value="user">user</option>
                    <option value="moderator">moderator</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.status}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Subscriptions</h2>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Renews</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id}>
                <td>{s.user.email}</td>
                <td>{s.plan}</td>
                <td>{s.status}</td>
                <td>{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Feature Flags</h2>
        <ul>
          {flags.map((f) => (
            <li key={f.key}>
              <label>
                <input type="checkbox" checked={f.enabled} onChange={() => toggleFlag(f.key, f.enabled)} />
                {f.key}
              </label>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid #27272a", padding: 16, borderRadius: 8, minWidth: 160 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ opacity: 0.7 }}>{label}</div>
    </div>
  );
}
