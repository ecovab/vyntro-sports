import { prisma } from "@vyntro/db";
import type { Sport } from "@vyntro/types";
import type { NormalizedMatch, NormalizedTeam } from "./adapters/SportsDataAdapter";

async function upsertSport(slug: Sport) {
  return prisma.sport.upsert({
    where: { slug },
    update: {},
    create: { slug, name: slug.charAt(0).toUpperCase() + slug.slice(1) },
  });
}

async function upsertCompetition(sportId: string, competition: NormalizedMatch["competition"]) {
  return prisma.competition.upsert({
    where: { sportId_externalRef: { sportId, externalRef: competition.externalRef } },
    update: {
      name: competition.name,
      country: competition.country,
      season: competition.season,
      tierWeight: competition.tierWeight ?? undefined,
    },
    create: {
      sportId,
      externalRef: competition.externalRef,
      name: competition.name,
      slug: competition.slug,
      country: competition.country,
      season: competition.season,
      tierWeight: competition.tierWeight ?? 10,
    },
  });
}

async function upsertTeam(sportId: string, team: NormalizedTeam) {
  return prisma.team.upsert({
    where: { sportId_externalRef: { sportId, externalRef: team.externalRef } },
    update: {
      name: team.name,
      shortName: team.shortName,
      country: team.country,
      logoUrl: team.logoUrl,
    },
    create: {
      sportId,
      externalRef: team.externalRef,
      name: team.name,
      shortName: team.shortName,
      country: team.country,
      logoUrl: team.logoUrl,
    },
  });
}

/**
 * Upserts provider-verified matches (and their teams/competitions) into Postgres.
 * Never invents scores or status — only persists exactly what the adapter returned.
 */
export async function ingestNormalizedMatches(sport: Sport, matches: NormalizedMatch[]) {
  if (matches.length === 0)
    return { ingested: 0, matches: [] as Array<{ id: string; status: string; previousStatus: string | null }> };

  const sportRow = await upsertSport(sport);
  const persisted: Array<{ id: string; status: string; previousStatus: string | null }> = [];

  for (const match of matches) {
    const [competition, homeTeam, awayTeam] = await Promise.all([
      upsertCompetition(sportRow.id, match.competition),
      upsertTeam(sportRow.id, match.homeTeam),
      upsertTeam(sportRow.id, match.awayTeam),
    ]);

    const existing = await prisma.match.findUnique({
      where: { sportId_externalRef: { sportId: sportRow.id, externalRef: match.externalRef } },
      select: { status: true },
    });

    const row = await prisma.match.upsert({
      where: { sportId_externalRef: { sportId: sportRow.id, externalRef: match.externalRef } },
      update: {
        competitionId: competition.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status: match.status,
        scheduledAt: new Date(match.scheduledAt),
        startedAt: match.startedAt ? new Date(match.startedAt) : undefined,
        endedAt: match.endedAt ? new Date(match.endedAt) : undefined,
        venue: match.venue,
        homeScore: match.homeScore ?? null,
        awayScore: match.awayScore ?? null,
        rawProviderPayload: match.raw as object | undefined,
      },
      create: {
        sportId: sportRow.id,
        externalRef: match.externalRef,
        competitionId: competition.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status: match.status,
        scheduledAt: new Date(match.scheduledAt),
        startedAt: match.startedAt ? new Date(match.startedAt) : undefined,
        endedAt: match.endedAt ? new Date(match.endedAt) : undefined,
        venue: match.venue,
        homeScore: match.homeScore ?? null,
        awayScore: match.awayScore ?? null,
        rawProviderPayload: match.raw as object | undefined,
      },
    });
    persisted.push({ id: row.id, status: row.status, previousStatus: existing?.status ?? null });
  }

  return { ingested: matches.length, matches: persisted };
}
