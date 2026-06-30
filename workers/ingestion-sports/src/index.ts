import { Queue, Worker } from "bullmq";
import { getAdapter, ingestNormalizedMatches } from "@vyntro/svc-matches";
import type { Sport } from "@vyntro/types";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const ACTIVE_SPORTS: Sport[] = ["football"];
const POLL_INTERVAL_MS = 30_000;

interface IngestLiveMatchesJob {
  sport: Sport;
}

const queue = new Queue<IngestLiveMatchesJob>("ingestion-sports", { connection });

const worker = new Worker<IngestLiveMatchesJob>(
  "ingestion-sports",
  async (job) => {
    const adapter = getAdapter(job.data.sport);
    const matches = await adapter.fetchLiveMatches();
    const result = await ingestNormalizedMatches(job.data.sport, matches);
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
