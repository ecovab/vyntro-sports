export interface ImportanceComponents {
  tierWeight: number;
  liveVolatility: number;
  newsVolume: number;
  socialSignal: number;
}

/**
 * Scoring formula for MAIN EVENT selection — weights are tunable config,
 * not hardcoded business logic, so the formula can evolve without redeploys
 * once Phase 6 wires this to admin feature flags.
 */
export function computeImportanceScore(components: ImportanceComponents): number {
  const { tierWeight, liveVolatility, newsVolume, socialSignal } = components;
  return tierWeight * 0.4 + liveVolatility * 0.3 + newsVolume * 0.2 + socialSignal * 0.1;
}
