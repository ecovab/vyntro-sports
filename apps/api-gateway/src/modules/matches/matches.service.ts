import { Injectable } from "@nestjs/common";
import { prisma, type MatchStatus } from "@vyntro/db";

@Injectable()
export class MatchesService {
  async listMatches(filters: { sport?: string; competition?: string; status?: string; date?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.sport) where.sport = { slug: filters.sport };
    if (filters.competition) where.competitionId = filters.competition;
    if (filters.status) where.status = filters.status as MatchStatus;
    if (filters.date) {
      const start = new Date(filters.date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.scheduledAt = { gte: start, lt: end };
    }

    return prisma.match.findMany({
      where,
      include: { sport: true, competition: true, homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: "asc" },
      take: 100,
    });
  }

  async getMatchById(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        sport: true,
        competition: true,
        homeTeam: true,
        awayTeam: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!match) return null;

    const aiSummary = await prisma.aiSummary.findUnique({
      where: { subjectType_subjectId: { subjectType: "match", subjectId: id } },
    });
    return { ...match, aiSummary: aiSummary?.summaryText ?? null };
  }

  async getStandings(competitionId: string) {
    const standings: Array<{ subjectId: string; [key: string]: unknown }> = await prisma.standing.findMany({
      where: { competitionId },
      orderBy: { rank: "asc" },
    });
    const teams: Array<{ id: string; [key: string]: unknown }> = await prisma.team.findMany({
      where: { id: { in: standings.map((s) => s.subjectId) } },
    });
    const teamById = new Map(teams.map((team) => [team.id, team]));
    return standings.map((standing) => ({ ...standing, team: teamById.get(standing.subjectId) ?? null }));
  }
}
