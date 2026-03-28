# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend development (from /app)
cd app && npm run dev          # Dev server on port 3000
cd app && npm run build        # Production build
cd app && npm run start        # Start production server

# Agent pipeline (from root)
cd app && npm run agents       # Run full pipeline: data-agent → smart-features → extra-features → build

# Individual agents (from root)
node scripts/data-agent.js             # Validate & enrich raw data
node scripts/smart-features-agent.js   # Assign badges & rankings
node scripts/extra-features-agent.js   # Export CSV, copy to frontend, create snapshots
```

## Architecture

### Data Flow

```
data/hosting.json (raw source of truth)
  → scripts/data-agent.js           → data/hosting-processed.json (validated, scored)
  → scripts/smart-features-agent.js → data/hosting-processed.json (badges, rankings added)
  → scripts/extra-features-agent.js → data/hosting-export.csv
                                    → data/snapshots/snapshot-*.json
                                    → app/src/data/hosting-data.json (stripped copy for frontend)
  → Next.js dashboard renders from app/src/data/hosting-data.json
```

### Agent Pipeline (`scripts/`)

Each agent is a standalone Node.js script executed in sequence by `run-agents.js`:

- **data-agent.js** — Validates required fields, calculates `valueScore` (weighted: price 40%, storage 25%, accounts 20%, uptime 15%), generates `price_history` (2023-2026), detects price changes, computes `yearly_savings`
- **smart-features-agent.js** — Assigns badges (`cheapest`, `best-value`, `most-accounts`, `best-uptime`, `price-drop`, `price-increase`, `recommended`), ranks by valueScore, generates summary metadata
- **extra-features-agent.js** — Exports CSV, checks data freshness (warns >30 days), creates timestamped snapshots, strips internal fields and copies clean data to `app/src/data/`

### Frontend (`app/`)

Next.js 15 App Router with React 19, TypeScript, Tailwind CSS 4, shadcn/ui patterns.

- **page.tsx** — Main dashboard (client component). Manages state for search, type filters, billing cycle, sort, and multi-year comparison (2023-2026). Groups providers by name with plan rollup.
- **hosting-table.tsx** — Core comparison table with sortable columns, value score bars, sparkline price history charts, expandable detail rows, YoY delta badges
- **summary-cards.tsx** — 6 KPI cards (cheapest, best value, price drops, avg uptime, total providers, avg price)
- **filters-bar.tsx** — Search, billing cycle toggle, year comparison pills, CSV export
- **sidebar.tsx** — Collapsible left nav (272px/68px) with category filters, market overview, price movement, recommended picks
- **lib/types.ts** — All TypeScript interfaces (`HostingProvider`, `GroupedProvider`, `Summary`, etc.)

### Data Schema

`data/hosting.json` entries require: `id`, `name`, `plan`, `type`, `price_monthly`, `currency`. Optional: `price_yearly`, `previous_price`, `storage`, `bandwidth`, `accounts`, `free_domain`, `free_ssl`, `uptime_guarantee`, `support`, `url`, `affiliate_url`, `recommended`, `notes`, `last_updated`.

### Badge-to-variant mapping

`cheapest`/`price-drop` → success (green), `best-value`/`best-uptime` → info (blue), `most-accounts`/`recommended` → purple, `price-increase` → warning (orange).

## Key Design Decisions

- **JSON as single source of truth** — All data originates from `data/hosting.json`; agents enrich but never modify the raw file
- **Agent modularity** — Each script reads the previous output and can run independently for debugging
- **Frontend data stripping** — `extra-features-agent.js` removes internal/debug fields before copying to `app/src/data/` to reduce bundle size
- **Standalone output** — `next.config.ts` uses `output: 'standalone'` for self-contained deployment
- **Theme persistence** — Dark/light mode stored in localStorage with system preference fallback; hydration-safe script injected in layout
