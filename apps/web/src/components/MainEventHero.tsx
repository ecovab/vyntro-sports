"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GlassCard, LiveBadge, Skeleton } from "@vyntro/ui";
import { apiClient } from "../lib/api";

export function MainEventHero() {
  const { data, isLoading } = useQuery({
    queryKey: ["main-event"],
    queryFn: () => apiClient.getMainEvent(),
  });

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-white/50">Main Event</h1>
        <LiveBadge />
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <GlassCard>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : data ? (
            <div>
              <p className="text-2xl font-bold text-white">Importance score: {data.score.toFixed(1)}</p>
              <p className="mt-1 text-white/60">Started {new Date(data.startedAt).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-white/60">
              No event is currently flagged as MAIN EVENT — the trending engine selects the biggest
              sporting moment in the world automatically once live data is flowing.
            </p>
          )}
        </GlassCard>
      </motion.div>
    </section>
  );
}
