import { GlassCard, LiveBadge } from "@vyntro/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-semibold uppercase tracking-widest text-white/50">Main Event</h1>
          <LiveBadge />
        </div>
        <GlassCard>
          <p className="text-white/70">
            The biggest sporting moment in the world right now will render here, selected
            automatically by the trending engine.
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
