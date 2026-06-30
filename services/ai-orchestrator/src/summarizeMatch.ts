import { completeText, AI_MODEL } from "./client";
import { containsAllTerms } from "./guard";

export interface VerifiedMatchFacts {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished" | "postponed";
  events: Array<{ minute: number; type: string; team: string; player?: string }>;
}

const SYSTEM_PROMPT = `You are a sports recap engine. You will be given a JSON object of verified match facts.
Rules:
- Use ONLY the facts provided. Never invent players, events, scores, or context not present in the JSON.
- Do not speculate about causes, motives, or future outcomes.
- Write exactly one or two short sentences, plain text, no markdown.
- If the facts are sparse, write a minimal factual sentence rather than padding with assumptions.`;

function templateFallback(facts: VerifiedMatchFacts): string {
  const scoreline = `${facts.homeTeam} ${facts.homeScore}-${facts.awayScore} ${facts.awayTeam}`;
  if (facts.events.length === 0) {
    return `${scoreline}.`;
  }
  const lastEvent = facts.events[facts.events.length - 1];
  return `${scoreline}. Latest: ${lastEvent.type} (${lastEvent.minute}') ${lastEvent.team}${
    lastEvent.player ? ` - ${lastEvent.player}` : ""
  }.`;
}

function isValid(text: string, facts: VerifiedMatchFacts): boolean {
  const requiredTerms = [facts.homeTeam, facts.awayTeam, String(facts.homeScore), String(facts.awayScore)];
  return text.length > 0 && text.length < 600 && containsAllTerms(text, requiredTerms);
}

export interface SummaryResult {
  text: string;
  modelUsed: string;
}

export async function summarizeMatch(facts: VerifiedMatchFacts): Promise<SummaryResult> {
  try {
    const text = await completeText(SYSTEM_PROMPT, JSON.stringify(facts), 200);
    if (isValid(text, facts)) {
      return { text, modelUsed: AI_MODEL };
    }
  } catch {
    // fall through to deterministic template — AI is best-effort, never load-bearing
  }
  return { text: templateFallback(facts), modelUsed: "template-fallback" };
}
