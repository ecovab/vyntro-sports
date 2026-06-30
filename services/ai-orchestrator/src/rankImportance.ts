export interface RankableSubject {
  id: string;
  signals: Record<string, number>;
}

export interface RankedSubject {
  id: string;
  score: number;
}

/**
 * Deterministic weighted scoring — not an LLM call. Importance ranking must
 * be reproducible and auditable, so it stays a plain weighted sum over
 * verified signals (favorites count, view velocity, competition tier, etc).
 */
const DEFAULT_WEIGHTS: Record<string, number> = {
  favoritesCount: 2,
  viewVelocity: 3,
  tierWeight: 1,
  recencyMinutes: -0.1,
};

export async function rankImportance(
  subjects: RankableSubject[],
  weights: Record<string, number> = DEFAULT_WEIGHTS,
): Promise<RankedSubject[]> {
  const scored = subjects.map((subject) => {
    const score = Object.entries(subject.signals).reduce((total, [key, value]) => {
      const weight = weights[key] ?? 0;
      return total + weight * value;
    }, 0);
    return { id: subject.id, score };
  });
  return scored.sort((a, b) => b.score - a.score);
}
