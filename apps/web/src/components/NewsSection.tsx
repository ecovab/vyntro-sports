"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@vyntro/ui";
import { apiClient } from "../lib/api";
import { NewsCard } from "./NewsCard";

export function NewsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => apiClient.getNews(),
  });

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/50">Latest News</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : data && data.length > 0
            ? data.map((article) => <NewsCard key={article.id} article={article} />)
            : <p className="text-white/50">No news yet — the ingestion pipeline will populate this feed.</p>}
      </div>
    </section>
  );
}
