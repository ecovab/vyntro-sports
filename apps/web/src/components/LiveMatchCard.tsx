import { GlassCard, LiveBadge } from "@vyntro/ui";
import type { MatchSummary } from "@vyntro/types";

export function LiveMatchCard({ match }: { match: MatchSummary }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/40">{match.status}</span>
        {match.status === "live" && <LiveBadge />}
      </div>
      <div className="mt-3 flex items-center justify-between text-white">
        <span className="font-semibold">{match.homeScore ?? "–"}</span>
        <span className="text-white/40">vs</span>
        <span className="font-semibold">{match.awayScore ?? "–"}</span>
      </div>
      <p className="mt-2 text-xs text-white/40">{new Date(match.scheduledAt).toLocaleString()}</p>
    </GlassCard>
  );
}
