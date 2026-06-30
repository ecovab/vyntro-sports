/**
 * AI is processing-only: every function here takes verified facts already
 * persisted in Postgres and returns text/annotations. It never originates
 * scores, events, or news content — see docs/architecture for the rule.
 */

export interface VerifiedMatchFacts {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  events: Array<{ minute: number; type: string; team: string; player?: string }>;
}

export async function summarizeMatch(_facts: VerifiedMatchFacts): Promise<string> {
  // Implemented in Phase 6: call Claude with facts-only prompt, validate output
  throw new Error("Not implemented");
}

export async function summarizeArticle(_title: string, _content: string): Promise<string> {
  throw new Error("Not implemented");
}

export async function rankImportance(_subjects: Array<{ id: string; signals: Record<string, number> }>) {
  throw new Error("Not implemented");
}

export async function generateNotificationCopy(_event: { type: string; context: Record<string, unknown> }) {
  throw new Error("Not implemented");
}
