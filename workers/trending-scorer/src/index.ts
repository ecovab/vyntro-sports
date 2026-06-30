import { Queue, Worker } from "bullmq";
import { prisma } from "@vyntro/db";
import { cacheSet, publish } from "@vyntro/cache";
import { selectMainEvent } from "@vyntro/svc-trending";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const SCORE_INTERVAL_MS = 15_000;
const MAIN_EVENT_CACHE_KEY = "main-event:current";
const MAIN_EVENT_CACHE_TTL_SECONDS = 5;
const MAIN_EVENT_CHANGED_CHANNEL = "main_event.changed";

const queue = new Queue("trending-scorer", { connection });

async function hydrate(mainEventId: string, matchId: string | null, articleId: string | null, score: number) {
  if (matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { sport: true, competition: true, homeTeam: true, awayTeam: true },
    });
    if (!match) return null;
    return {
      id: mainEventId,
      matchId: match.id,
      articleId: null,
      score,
      startedAt: (match.startedAt ?? match.scheduledAt).toISOString(),
      match,
    };
  }
  if (articleId) {
    const article = await prisma.newsArticle.findUnique({ where: { id: articleId }, include: { source: true } });
    if (!article) return null;
    return {
      id: mainEventId,
      matchId: null,
      articleId: article.id,
      score,
      startedAt: article.publishedAt.toISOString(),
      article,
    };
  }
  return null;
}

/**
 * Scores every live/upcoming event, persists the winner as the new MAIN
 * EVENT, pre-warms the read cache the API gateway serves from, and
 * broadcasts the change over Redis pub/sub for the WS gateway to fan out.
 */
async function runScoringPass(): Promise<void> {
  const candidate = await selectMainEvent();

  const currentOpen = await prisma.mainEvent.findFirst({ where: { endedAt: null }, orderBy: { startedAt: "desc" } });
  if (!candidate) {
    if (currentOpen) {
      await prisma.mainEvent.update({ where: { id: currentOpen.id }, data: { endedAt: new Date() } });
    }
    return;
  }

  const isSameSubject = currentOpen?.matchId === candidate.matchId && currentOpen?.articleId === candidate.articleId;
  let mainEventId: string;
  if (isSameSubject && currentOpen) {
    await prisma.mainEvent.update({ where: { id: currentOpen.id }, data: { score: candidate.score } });
    mainEventId = currentOpen.id;
  } else {
    if (currentOpen) {
      await prisma.mainEvent.update({ where: { id: currentOpen.id }, data: { endedAt: new Date() } });
    }
    const created = await prisma.mainEvent.create({
      data: { matchId: candidate.matchId, articleId: candidate.articleId, score: candidate.score },
    });
    mainEventId = created.id;
  }

  const payload = await hydrate(mainEventId, candidate.matchId, candidate.articleId, candidate.score);
  await cacheSet(MAIN_EVENT_CACHE_KEY, MAIN_EVENT_CACHE_TTL_SECONDS, payload);
  await publish(MAIN_EVENT_CHANGED_CHANNEL, payload);
}

const worker = new Worker(
  "trending-scorer",
  async () => {
    await runScoringPass();
  },
  { connection },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});

async function scheduleRecurringJob() {
  await queue.add(
    "score",
    {},
    { repeat: { every: SCORE_INTERVAL_MS }, jobId: "score", removeOnComplete: true, removeOnFail: 50 },
  );
}

scheduleRecurringJob().catch((err) => {
  console.error("[trending-scorer] failed to schedule recurring job", err);
});
