# Vyntro Sports

Global sports intelligence platform — real-time scores, news, and AI-processed
summaries across football, rugby, cricket, MMA, boxing, F1, basketball, and tennis.

See [`docs/architecture/README.md`](docs/architecture/README.md) for the full
system architecture, tech stack, database schema, and API structure.

## Monorepo layout

```
apps/        web, mobile, admin, api-gateway
services/    matches, news, ai-orchestrator, notifications, billing, trending
workers/     background jobs (BullMQ): ingestion, trending, notifications
packages/    shared types, db (Prisma), ui, sdk, config
infra/       docker, k8s, CI
docs/        architecture docs
```

## Local development

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up -d
npm install
npm run dev
```
