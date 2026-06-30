import { Queue, Worker } from "bullmq";
import { getAdapter, ingestNormalizedMatches } from "@vyntro/svc-matches";
import { getOrGenerateMatchSummary } from "@vyntro/svc-ai-orchestrator";
import { enqueueNotificationEvent } from "@vyntro/svc-notifications";
import { prisma } from "@vyntro/db";
import type { Sport } from "@vyntro/types";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const ACTIVE_SPORTS: Sport[] = ["football"];
const POLL_INTERVAL_MS = 30_000;

interface IngestLiveMatchesJob {
  sport: Sport;
}

const queue = new Queue<IngestLiveMatchesJob>("ingestion-sports", { connection });

interface MatchEventRow {
  minute: number | null;
  type: string;
  teamId: string | null;
  playerId: string | null;
}

interface MatchTransition {
  id: string;
  status: string;
  previousStatus: string | null;
}

async function handleMatchTransition(sportId: string, transition: MatchTransition) {
  if (transition.status === transition.previousStatus) return;

  const match = await prisma.match.findUnique({
    where: { id: transition.id },
    include: { homeTeam: true, awayTeam: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!match) return;

  const homeTeamName = match.homeTeam?.name ?? "Home";
  const awayTeamName = match.awayTeam?.name ?? "Away";

  if (transition.status === "live" && transition.previousStatus !== "live") {
    await enqueueNotificationEvent({
      eventType: "match.kickoff",
      sportId,
      subjectType: "match",
      subjectId: match.id,
      title: "Kickoff",
      body: `${homeTeamName} vs ${awayTeamName} is underway.`,
    });
    return;
  }

  if (transition.status === "finished" && match.homeScore != null && match.awayScore != null) {
    const summary = await getOrGenerateMatchSummary({
      matchId: match.id,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: "finished",
      events: match.events.map((e: MatchEventRow) => ({
        minute: e.minute ?? 0,
        type: e.type,
        team: e.teamId ?? "",
        player: e.playerId ?? undefined,
      })),
    });

    await enqueueNotificationEvent({
      eventType: "match.finished",
      sportId,
      subjectType: "match",
      subjectId: match.id,
      title: "Full time",
      body: summary.summaryText,
    });
  }
}

const worker = new Worker<IngestLiveMatchesJob>(
  "ingestion-sports",
  async (job) => {
    const adapter = getAdapter(job.data.sport);
    const matches = await adapter.fetchLiveMatches();
    const result = await ingestNormalizedMatches(job.data.sport, matches);

    const sportRow = await prisma.sport.findUnique({ where: { slug: job.data.sport } });
    if (sportRow) {
      await Promise.allSettled(
        result.matches.map((m) =>
          handleMatchTransition(sportRow.id, m).catch((err) =>
            console.error(`[ingestion-sports] transition handling failed for match ${m.id}`, err),
          ),
        ),
      );
    }

    return result;
  },
  { connection },
);

worker.on("completed", (job, result) => {
  console.log(`[ingestion-sports] ${job.data.sport}: ${result.ingested} match(es) upserted`);
});

worker.on("failed", (job, err) => {
  console.error(`[ingestion-sports] job ${job?.id} (${job?.data.sport}) failed`, err);
});

async function scheduleRecurringJobs() {
  for (const sport of ACTIVE_SPORTS) {
    await queue.add(
      `poll-${sport}`,
      { sport },
      {
        repeat: { every: POLL_INTERVAL_MS },
        jobId: `poll-${sport}`,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }
}

scheduleRecurringJobs().catch((err) => {
  console.error("[ingestion-sports] failed to schedule recurring jobs", err);
});
