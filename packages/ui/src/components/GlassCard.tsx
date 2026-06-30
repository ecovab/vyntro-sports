import type { PropsWithChildren } from "react";

export function GlassCard({ children }: PropsWithChildren) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-lg">
      {children}
    </div>
  );
}
