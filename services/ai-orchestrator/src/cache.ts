import { createHash } from "crypto";
import { prisma } from "@vyntro/db";
import { summarizeMatch, type VerifiedMatchFacts } from "./summarizeMatch";
import { summarizeArticle } from "./summarizeArticle";

function hashFacts(facts: unknown): string {
  return createHash("sha256").update(JSON.stringify(facts)).digest("hex");
}

async function getCached(subjectType: string, subjectId: string, hash: string) {
  const existing = await prisma.aiSummary.findUnique({ where: { subjectType_subjectId: { subjectType, subjectId } } });
  if (existing && existing.verifiedAgainstHash === hash) {
    return existing;
  }
  return null;
}

async function upsertSummary(subjectType: string, subjectId: string, hash: string, text: string, modelUsed: string) {
  return prisma.aiSummary.upsert({
    where: { subjectType_subjectId: { subjectType, subjectId } },
    update: { summaryText: text, modelUsed, verifiedAgainstHash: hash, generatedAt: new Date() },
    create: { subjectType, subjectId, summaryText: text, modelUsed, verifiedAgainstHash: hash },
  });
}

/**
 * Returns the cached summary if the underlying facts haven't changed since it
 * was generated (verifiedAgainstHash matches), otherwise regenerates via
 * Claude (with a deterministic fallback) and persists the new version.
 */
export async function getOrGenerateMatchSummary(facts: VerifiedMatchFacts) {
  const hash = hashFacts(facts);
  const cached = await getCached("match", facts.matchId, hash);
  if (cached) return cached;

  const { text, modelUsed } = await summarizeMatch(facts);
  return upsertSummary("match", facts.matchId, hash, text, modelUsed);
}

export async function getOrGenerateArticleSummary(articleId: string, title: string, content: string) {
  const hash = hashFacts({ title, content });
  const cached = await getCached("article", articleId, hash);
  if (cached) return cached;

  const { text, modelUsed } = await summarizeArticle(title, content);
  return upsertSummary("article", articleId, hash, text, modelUsed);
}
