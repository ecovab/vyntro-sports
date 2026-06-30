import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

export async function completeText(systemPrompt: string, userPrompt: string, maxTokens = 300): Promise<string> {
  const response = await getAnthropicClient().messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected Claude response shape");
  }
  return block.text.trim();
}
