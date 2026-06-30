import { Queue, Worker } from "bullmq";
import { getAdapter, ingestNormalizedMatches } from "@vyntro/svc-matches";
import { getOrGenerateMatchSummary } from "@vyntro/svc-ai-orchestrator";
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

async function generateSummaryForFinishedMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!match || match.status !== "finished" || match.homeScore == null || match.awayScore == null) return;

  await getOrGenerateMatchSummary({
    matchId: match.id,
    homeTeam: match.homeTeam?.name ?? "Home",
    awayTeam: match.awayTeam?.name ?? "Away",
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
}

const worker = new Worker<IngestLiveMatchesJob>(
  "ingestion-sports",
  async (job) => {
    const adapter = getAdapter(job.data.sport);
    const matches = await adapter.fetchLiveMatches();
    const result = await ingestNormalizedMatches(job.data.sport, matches);

    const finished = result.matches.filter((m) => m.status === "finished");
    await Promise.allSettled(
      finished.map((m) =>
        generateSummaryForFinishedMatch(m.id).catch((err) =>
          console.error(`[ingestion-sports] summary generation failed for match ${m.id}`, err),
        ),
      ),
    );

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
