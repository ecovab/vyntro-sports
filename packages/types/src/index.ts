export type Sport = "football" | "rugby" | "cricket" | "mma" | "boxing" | "f1" | "basketball" | "tennis";

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export interface MatchSummary {
  id: string;
  sportId: string;
  competitionId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  status: MatchStatus;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface MainEvent {
  id: string;
  matchId: string | null;
  articleId: string | null;
  score: number;
  startedAt: string;
}

export interface NewsArticleSummary {
  id: string;
  title: string;
  sourceId: string;
  sportId: string | null;
  publishedAt: string;
  url: string;
}

export type SubscriptionPlan = "free" | "premium_monthly" | "premium_yearly";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "user" | "admin" | "moderator";
  emailVerified: boolean;
}
