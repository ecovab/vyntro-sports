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
}
