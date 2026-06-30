import { GlassCard } from "@vyntro/ui";
import type { NewsArticleSummary } from "@vyntro/types";

export function NewsCard({ article }: { article: NewsArticleSummary }) {
  return (
    <a href={article.url} target="_blank" rel="noreferrer">
      <GlassCard>
        <p className="font-medium text-white">{article.title}</p>
        <p className="mt-2 text-xs text-white/40">{new Date(article.publishedAt).toLocaleDateString()}</p>
      </GlassCard>
    </a>
  );
}
