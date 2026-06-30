import type { Sport } from "@vyntro/types";
import type { SportsDataAdapter } from "./adapters/SportsDataAdapter";
import { FootballAdapter } from "./adapters/FootballAdapter";

/**
 * Registering a new sport is the only step required to extend coverage —
 * no changes to domain services, controllers, or DB schema needed.
 */
const adapters: Partial<Record<Sport, SportsDataAdapter>> = {
  football: new FootballAdapter(),
};

export function getAdapter(sport: Sport): SportsDataAdapter {
  const adapter = adapters[sport];
  if (!adapter) {
    throw new Error(`No SportsDataAdapter registered for sport: ${sport}`);
  }
  return adapter;
}
