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
7. ✅ Notifications
8. ✅ Subscription system
9. ✅ Admin dashboard
10. ✅ Optimization + deployment

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
those facts change.

Phase 7 adds the `Device` model and a `NotificationPreference` per
user/sport/eventType/channel (sport `""` is the "all sports" sentinel, kept
non-null so the unique constraint stays usable for upserts). `@vyntro/svc-notifications`
provides FCM (legacy HTTP API) and raw APNs (HTTP/2 + ES256 provider JWT, no
third-party library) senders behind `dispatchPush`, plus `enqueueNotificationEvent`
(BullMQ producer) and `notifyUsersForEvent` (fan-out to subject favorites and
sport followers, gated by preferences, always recorded in `Notification`
regardless of push outcome). The `notification-dispatcher` worker consumes the
queue; `ingestion-sports` enqueues `match.kickoff`/`match.finished` on status
transitions (using a pre-upsert `previousStatus` lookup to avoid duplicate
triggers on repeated polls), and `ingestion-news` enqueues `news.breaking` for
each newly ingested article. The API gateway's `notifications` module now
reads/writes real Prisma rows for list/markRead/preferences/device
registration.

Phase 8 implements `@vyntro/svc-billing` against the real Stripe SDK:
`createCheckoutSession` lazily creates (and persists) a Stripe customer per
user, then opens a subscription-mode Checkout session for the
`premium_monthly`/`premium_yearly` price configured in `.env`;
`createPortalSession` opens the Billing Portal for self-service plan
changes/cancellation. `handleSubscriptionWebhookEvent` is the only writer of
`Subscription`/`Invoice` state — it verifies the Stripe signature against
`STRIPE_WEBHOOK_SECRET` before processing `checkout.session.completed`,
`customer.subscription.{created,updated,deleted}`, and `invoice.{paid,payment_failed}`,
so plan/status changes are never trusted from client input. The API gateway
enables `rawBody` capture in `main.ts` specifically so the webhook route can
verify the raw, unparsed payload.

Phase 9 implements the real `AdminController`/`AdminService` (RBAC-gated by
`@Roles("admin")`) backed by Prisma: user list/role-and-status edits,
subscription listing, an analytics summary (user/premium/live-match/article
counts), and a `FeatureFlag` model with upsert-on-write semantics. Every
mutating admin action (`user.update`, `feature-flag.update`) writes an
`AdminAuditLog` row capturing who changed what, so admin actions are
reviewable. `apps/admin` (Next.js) is a real dashboard against this API —
its own zustand-persisted session store, an admin-only login gate that
rejects non-`admin` roles client-side (the server-side `RolesGuard` is the
actual enforcement boundary), and pages for the overview stats, user table,
subscriptions table, and feature-flag toggles.

Phase 10 enables the rate limiter that had been registered but never
enforced: `ThrottlerGuard` now runs as a global `APP_GUARD` alongside
`JwtAuthGuard`/`RolesGuard`. A new `@vyntro/cache` package wraps `ioredis`
in a `cacheWrap`/`cacheInvalidate` cache-aside helper, used only in front of
the two hottest read paths — `MainEventService.getCurrent` (5s TTL) and
`MatchesService.listMatches` (10s TTL, keyed by filters) — Postgres remains
the source of truth and these caches are a latency optimization only. A
public, throttle-exempt `/health` endpoint runs `SELECT 1` against Postgres
for load-balancer probes. Deployment is real multi-stage Docker builds:
`Dockerfile.api-gateway` (dedicated), `Dockerfile.worker` and
`Dockerfile.web` (generic, parameterized by build args) cover every
deployable unit, wired together in `infra/docker/docker-compose.yml`
alongside Postgres/Redis with healthchecks. `.github/workflows/ci.yml` runs
the full pipeline (install, `prisma generate`, `prisma db push`, lint,
typecheck, build, test) against real Postgres/Redis service containers.
`SENTRY_DSN` is scaffolded in `.env.example` only — not yet wired into
code, marked as an explicit boundary rather than half-implemented.
