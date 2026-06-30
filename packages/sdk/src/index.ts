import type { MainEvent, MatchSummary, NewsArticleSummary } from "@vyntro/types";

export interface VyntroClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | undefined;
}

export class VyntroClient {
  constructor(private readonly config: VyntroClientConfig) {}

  private async request<T>(path: string): Promise<T> {
    const token = this.config.getAccessToken?.();
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      throw new Error(`Vyntro API error ${res.status}: ${path}`);
    }
    return res.json() as Promise<T>;
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
}
