"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@vyntro/ui";
import { apiClient } from "../lib/api";
import { LiveMatchCard } from "./LiveMatchCard";

export function MatchesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["matches", "live"],
    queryFn: () => apiClient.getMatches("?status=live"),
  });

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/50">Live Matches</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : data && data.length > 0
            ? data.map((match) => <LiveMatchCard key={match.id} match={match} />)
            : <p className="text-white/50">No live matches right now. Check back soon.</p>}
      </div>
    </section>
  );
}
