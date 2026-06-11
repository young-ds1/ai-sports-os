# AI Sports OS

AI-driven global sports intelligence platform.

## Quick Start

```bash
# 1. Start infrastructure
docker compose -f docker/docker-compose.yml up -d postgres redis

# 2. Install dependencies
pnpm install

# 3. Run migrations
pnpm db:migrate

# 4. Seed World Cup 2026 data
pnpm db:seed

# 5. Start backend (port 3001)
pnpm dev:backend

# 6. Start frontend (port 3000)
pnpm dev:web
```

## Project Structure

```
ai-sports-os/
├── apps/web/           # Next.js frontend
├── backend/            # NestJS API server
├── modules/
│   ├── domain/         # ② Domain Layer (facts)
│   ├── ai-engine/      # ③ AI Processing
│   ├── ingestion/      # ① Data Ingestion
│   ├── users/          # User system
│   └── content/        # Content factory (Phase 3)
├── providers/          # Data source adapters
├── shared/             # Shared utilities
├── infrastructure/     # DB, Redis, Queue configs
└── docs/               # Vision, PRD, Architecture
```

## API Endpoints (MVP)

- `GET /api/matches` — Today's matches
- `GET /api/matches/:id` — Match detail
- `GET /api/teams/:id` — Team profile
- `GET /api/players/:id` — Player profile
- `GET /api/ai/analysis/:matchId` — AI analysis
- `POST /api/ai/chat` — AI chat agent
- `GET /api/ai/predictions/:matchId` — AI prediction

## Architecture

4-layer architecture:
1. **Data Ingestion** — Pulls from API-Football, normalizes data
2. **Domain Layer** — PostgreSQL fact tables
3. **Event & AI Processing** — BullMQ workers pre-generate AI analysis
4. **Application Layer** — NestJS API + Next.js frontend

## North Star Metric

**AI Requests Per DAU** = total AI chat + analysis requests / daily active users

- < 0.3 = Fail
- > 1.0 = Validated
- > 2.0 = Strong demand
