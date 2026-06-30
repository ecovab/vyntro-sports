import { completeText, AI_MODEL } from "./client";

export interface NotificationEvent {
  type: string;
  context: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You write push notification copy for a sports app. You will be given an event type and a
JSON context object of verified facts.
Rules:
- Use ONLY the facts in the context object. Never invent names, scores, or details.
- Write one short sentence, under 100 characters, no markdown, no emoji unless asked.`;

function templateFallback(event: NotificationEvent): string {
  const contextSummary = Object.entries(event.context)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${event.type}: ${contextSummary}`.slice(0, 140);
}

export async function generateNotificationCopy(event: NotificationEvent): Promise<{ text: string; modelUsed: string }> {
  try {
    const text = await completeText(SYSTEM_PROMPT, JSON.stringify(event), 60);
    if (text.length > 0 && text.length <= 140) {
      return { text, modelUsed: AI_MODEL };
    }
  } catch {
    // fall through to deterministic template — AI is best-effort, never load-bearing
  }
  return { text: templateFallback(event), modelUsed: "template-fallback" };
}
