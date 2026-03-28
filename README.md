# Universal Hosting Decision Engine

A production-ready dashboard for comparing web hosting providers across plans, pricing, and features. Built with Next.js 15, React 19, and an automated agent pipeline that validates, scores, and enriches hosting data from a single JSON source.

## Quick Start

```bash
# Install dependencies
cd app && npm install

# Run the agent pipeline (processes data + builds)
npm run agents

# Or just start the dev server (requires agents to have run at least once)
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## How It Works

Raw hosting data lives in `data/hosting.json`. A three-stage agent pipeline processes it into a frontend-ready dataset:

```
data/hosting.json
  → data-agent.js           validates, scores, generates price history
  → smart-features-agent.js assigns badges, ranks providers
  → extra-features-agent.js exports CSV, creates snapshots, copies clean data to frontend
  → Next.js dashboard renders the result
```

Each agent runs as a standalone Node.js script. Run the full pipeline with `npm run agents` from the `app/` directory, or run agents individually from the project root:

```bash
node scripts/data-agent.js
node scripts/smart-features-agent.js
node scripts/extra-features-agent.js
```

## Dashboard Features

- **Provider comparison table** with sortable columns, expandable detail rows, and sparkline price charts
- **Value scoring** — weighted composite (price 40%, storage 25%, accounts 20%, uptime 15%)
- **Badges** — cheapest, best-value, most-accounts, best-uptime, price-drop, price-increase, recommended
- **Billing toggle** — switch between monthly and yearly pricing
- **Multi-year comparison** — view pricing trends from 2023-2026
- **Summary cards** — 6 KPI cards for quick insights
- **Sidebar filters** — filter by hosting type, view market overview, price movements, recommended picks
- **CSV export** — download comparison data
- **Dark/light mode** — system preference with manual toggle

## Adding a Provider

Add a new entry to `data/hosting.json` with the required fields:

```json
{
  "id": "provider-plan",
  "name": "Provider Name",
  "plan": "Plan Name",
  "type": "Shared",
  "price_monthly": 4.99,
  "currency": "USD"
}
```

Optional fields: `price_yearly`, `previous_price`, `storage`, `bandwidth`, `accounts`, `free_domain`, `free_ssl`, `uptime_guarantee`, `support`, `features`, `url`, `affiliate_url`, `recommended`, `notes`, `last_updated`.

Then run `npm run agents` from `app/` to process and rebuild.

## Production Build

```bash
# Full production build with cache cleanup
cd app && npm run build:prod

# Or use the shell script (runs agents + build + prune)
bash scripts/build-prod.sh
```

The app uses Next.js standalone output mode. Deploy the contents of `app/.next/standalone`, `app/.next/static`, and `app/public`.

## Tech Stack

- **Frontend** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Data pipeline** — Node.js scripts (no external dependencies)
- **Build** — Next.js standalone output for self-contained deployment

## Project Structure

```
data/hosting.json          ← source of truth (edit this to add/update providers)
scripts/
  run-agents.js            ← pipeline orchestrator
  data-agent.js            ← validation & scoring
  smart-features-agent.js  ← badges & rankings
  extra-features-agent.js  ← CSV export, snapshots, frontend data copy
app/                       ← Next.js application
  src/app/page.tsx         ← main dashboard
  src/components/          ← UI components
  src/data/hosting-data.json ← auto-generated (do not edit)
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture docs, [ENGINE.md](ENGINE.md) for orchestration rules, and [AGENTS.md](AGENTS.md) for agent responsibilities.

## Author

Made by Johnbert O.
