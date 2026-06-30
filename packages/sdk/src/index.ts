import type { MainEvent, MatchSummary, NewsArticleSummary, UserProfile } from "@vyntro/types";

export interface VyntroClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | undefined;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export class VyntroClient {
  constructor(private readonly config: VyntroClientConfig) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.config.getAccessToken?.();
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? `Vyntro API error ${res.status}: ${path}`);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }

  private post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  private patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  getMainEvent() {
    return this.request<MainEvent>("/api/v1/main-event");
  }

  getMatches(query: string = "") {
    return this.request<MatchSummary[]>(`/api/v1/sports/matches${query}`);
  }

  getNews(query: string = "") {
    return this.request<NewsArticleSummary[]>(`/api/v1/news${query}`);
  }

  signup(email: string, password: string, displayName?: string) {
    return this.post<AuthResponse>("/api/v1/auth/signup", { email, password, displayName });
  }

  login(email: string, password: string) {
    return this.post<AuthResponse>("/api/v1/auth/login", { email, password });
  }

  refresh(refreshToken: string) {
    return this.post<AuthTokens>("/api/v1/auth/refresh", { refreshToken });
  }

  logout(refreshToken: string) {
    return this.post<void>("/api/v1/auth/logout", { refreshToken });
  }

  getMe() {
    return this.request<UserProfile>("/api/v1/auth/me");
  }

  // Admin

  adminListUsers() {
    return this.request<AdminUser[]>("/api/v1/admin/users");
  }

  adminUpdateUser(id: string, patch: Partial<Pick<AdminUser, "role" | "status" | "displayName">>) {
    return this.patch<AdminUser>(`/api/v1/admin/users/${id}`, patch);
  }

  adminListSubscriptions() {
    return this.request<AdminSubscription[]>("/api/v1/admin/subscriptions");
  }

  adminGetAnalytics() {
    return this.request<AdminAnalytics>("/api/v1/admin/analytics");
  }

  adminGetLogs() {
    return this.request<AdminAuditLogEntry[]>("/api/v1/admin/logs");
  }

  adminGetFeatureFlags() {
    return this.request<AdminFeatureFlag[]>("/api/v1/admin/feature-flags");
  }

  adminUpdateFeatureFlag(key: string, enabled: boolean) {
    return this.patch<AdminFeatureFlag>(`/api/v1/admin/feature-flags/${key}`, { enabled });
  }
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin" | "moderator";
  status: string;
  createdAt: string;
}

export interface AdminSubscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  user: { id: string; email: string; displayName: string | null };
}

export interface AdminAnalytics {
  totalUsers: number;
  premiumSubscriptions: number;
  liveMatches: number;
  articlesLast24h: number;
}

export interface AdminAuditLogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  admin: { id: string; email: string };
}

export interface AdminFeatureFlag {
  key: string;
  enabled: boolean;
  updatedAt: string;
}
