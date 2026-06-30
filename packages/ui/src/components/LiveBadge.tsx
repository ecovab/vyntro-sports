export interface LiveBadgeProps {
  label?: string;
}

export function LiveBadge({ label = "LIVE" }: LiveBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
      {label}
    </span>
  );
}
