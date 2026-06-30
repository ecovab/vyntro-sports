import { completeText, AI_MODEL } from "./client";
import { wordOverlapRatio } from "./guard";
import type { SummaryResult } from "./summarizeMatch";

const SYSTEM_PROMPT = `You are a news summarization engine. You will be given an article's title and body text.
Rules:
- Summarize ONLY what is stated in the provided text. Never add facts, quotes, statistics, or context that
  are not present in the source.
- Write exactly one or two short sentences, plain text, no markdown.
- If the body text is empty or too short to summarize, summarize the title alone.`;

const MIN_OVERLAP_RATIO = 0.35;

function templateFallback(title: string, content: string): string {
  if (!content) return title;
  const firstSentence = content.split(/(?<=[.!?])\s/)[0];
  return firstSentence.length > 280 ? `${firstSentence.slice(0, 277)}...` : firstSentence;
}

export async function summarizeArticle(title: string, content: string): Promise<SummaryResult> {
  const source = `${title}\n${content}`;
  try {
    const text = await completeText(SYSTEM_PROMPT, `Title: ${title}\n\nBody:\n${content || "(no body text)"}`, 200);
    if (text.length > 0 && text.length < 600 && wordOverlapRatio(text, source) >= MIN_OVERLAP_RATIO) {
      return { text, modelUsed: AI_MODEL };
    }
  } catch {
    // fall through to deterministic template — AI is best-effort, never load-bearing
  }
  return { text: templateFallback(title, content), modelUsed: "template-fallback" };
}
