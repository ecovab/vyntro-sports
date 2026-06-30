# Vyntro Sports — Architecture

## Tech Stack

- **Web:** Next.js 14 (App Router, TS), Tailwind + shadcn/Radix, Framer Motion, TanStack Query, Zustand
- **Mobile:** React Native (Expo), sharing `@vyntro/types` and `@vyntro/sdk` with web
- **API:** NestJS (TS) modular monolith-to-microservices, REST + WebSocket gateway
- **Data:** PostgreSQL (source of truth) via Prisma, Redis (cache/pub-sub/queues)
- **Workers:** BullMQ background jobs for ingestion, trending, AI, notifications
- **AI:** Claude (Anthropic API) — processing/annotation only, never a source of truth
- **Auth:** Auth.js/Supabase Auth — email, Google, Apple, verification, reset
- **Payments:** Stripe — monthly/yearly subscriptions, webhooks, customer portal
- **Infra:** Turborepo monorepo, Docker, Fly.io/Render → k8s at scale, GitHub Actions, Cloudflare, Sentry

## Core Rule

Workers write verified facts → Postgres. The AI orchestrator only **reads** facts
and **writes annotations** (summaries, importance scores, dedup flags). It never
originates match data, scores, or events.

## MAIN EVENT Selection

A continuous scoring worker (`workers/trending-scorer`) computes an importance
score per live/upcoming event from competition tier weight, live volatility
(goals/cards/knockout stage), and news/social volume (`services/trending`).
The highest score is cached in Redis and pushed to clients via WS pub/sub.

## Module Map

| Concern | Location |
|---|---|
| Web app | `apps/web` |
| Mobile app | `apps/mobile` |
| Admin dashboard | `apps/admin` |
| API gateway (auth, routing, RBAC) | `apps/api-gateway` |
| Match/sports domain + adapters | `services/matches` |
| News ingestion/dedup | `services/news` |
| AI orchestration | `services/ai-orchestrator` |
| Notification dispatch | `services/notifications` |
| Billing (Stripe) | `services/billing` |
| Trending/importance scoring | `services/trending` |
| Background workers | `workers/*` |
| Shared types | `packages/types` |
| Prisma schema/client | `packages/db` |
| Design system | `packages/ui` |
| Typed API client | `packages/sdk` |
| Shared config/env schema | `packages/config` |

## Adapter Pattern (Sports Extensibility)

New sports/providers implement `SportsDataAdapter`
(`services/matches/src/adapters/SportsDataAdapter.ts`) and register in
`services/matches/src/registry.ts`. No core schema or controller changes
required to add a sport — generic `sports`/`matches`/`match_events` tables
carry sport-specific detail in `jsonb` payload columns.

## Database Schema

See `packages/db/prisma/schema.prisma` for the full schema: Identity, Billing,
Sports Domain, News, AI, Engagement.

## API Structure

REST under `/api/v1`, versioned, modular by domain (auth, sports, news,
main-event, search, favorites, notifications, billing, admin). WebSocket
namespace `/ws` for live score/event/main-event push. Internal
`/api/v1/internal/*` endpoints are service-to-service only (ingestion
workers, AI triggers, trending recompute) — not public.

## Phased Roadmap

1. ✅ Architecture + tech stack + folder structure
2. ✅ Database schema
3. ✅ Authentication system
4. ✅ Basic UI
5. ✅ Live data integration
6. ✅ AI processing layer
7. Notifications
8. Subscription system
9. Admin dashboard
10. Optimization + deployment

Phase 5 wires the `ingestion-sports` and `ingestion-news` workers to real
providers (football-data.org for live matches/standings, RSS feeds for news),
normalizes their output through `@vyntro/svc-matches` / `@vyntro/svc-news`,
and upserts into Postgres idempotently via `externalRef` uniqueness. The API
gateway's matches/news/main-event services now read directly from Postgres
instead of returning stubs.

Phase 6 adds `@vyntro/svc-ai-orchestrator`: Claude calls are always built from
facts already persisted in Postgres, validated against those same facts after
the response comes back, and backed by a deterministic template fallback —
AI is annotation-only and never load-bearing. Generated summaries are cached
in `AiSummary` keyed by a hash of the source facts and only regenerate when
those facts change. Phases 7–10 remain empty-but-wired skeletons, each marked
with `Not implemented` / `TODO` at the exact integration points.
