# Presentation Bot

Gamma-style AI presentation generator delivered through a Telegram bot.
NestJS (modular monolith) + PostgreSQL (Prisma) + Redis/BullMQ.

## Stack

- **NestJS 11** — modular monolith
- **PostgreSQL + Prisma** — persistence
- **Redis + BullMQ** — async generation pipeline (outline -> cards -> images -> render)
- **pino** — structured logging
- **zod** — env validation

## Prerequisites (no Docker)

Install and run locally:

- Node.js >= 20, pnpm (`npm i -g pnpm`)
- PostgreSQL >= 14 running on `localhost:5432`
- Redis >= 6 running on `localhost:6379`

Create the database:

```bash
createdb presentation_bot
```

## Setup

```bash
pnpm install
cp .env.example .env        # then fill in TELEGRAM_BOT_TOKEN etc.
pnpm prisma:generate
pnpm prisma:migrate         # creates tables (dev migration)
pnpm start:dev
```

App boots on http://localhost:3000. On a clean boot you should see
"Connected to PostgreSQL" and "Application running...".

## Project structure

```
src/
  main.ts                  app bootstrap
  app.module.ts            root module (wires foundation + future features)
  common/
    config/                env validation (zod) + typed config + ConfigModule
    filters/               global exception filter
  infra/
    prisma/                PrismaModule + PrismaService (global)
    queue/                 BullMQ setup + named queues
  modules/                 feature modules (added per phase)
prisma/
  schema.prisma            data model
```

## Roadmap

- [x] Phase 0 — foundation (config, prisma, queue, logging)
- [ ] Phase 1 — bot + user registration + FSM
- [x] Phase 2 — parameter collection (inline keyboards)
- [x] Phase 3 — outline generation + review
- [x] Phase 4 — card generation + queue workers
- [ ] Phase 5 — HTML -> PDF render (Tier 1 layouts, 1 theme)
- [ ] Phase 6 — image generation + storage
- [ ] Phase 7 — delivery + post-actions
- [ ] Phase 8 — polish (themes, layouts, credits, PPTX)
