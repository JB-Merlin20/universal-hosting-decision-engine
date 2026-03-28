# Agents.md

## Hosting Decision Engine – Team & Automation Agents

This file outlines the **team-oriented agents** for the Hosting Decision Engine and describes their automation responsibilities.

---

### Team Assignment Overview

Each agent represents a **functional domain**, not a single task. This allows team members to work in parallel efficiently.

| Agent                             | Team / Role         | Responsibilities                                                                                                                                   |
| --------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Agent**                    | Data Engineer       | Maintain `/data/hosting.json`, add/update providers, calculate `valueScore`, track price changes (`previous_price`) and `last_updated` timestamps. |
| **Table & Filters Agent**         | Frontend Dev        | Build table component with sorting, badges, sticky header, hover highlight; implement provider/type filters, billing toggle, and search input.     |
| **Cards & Summary Agent**         | Frontend Dev        | Generate summary cards (Cheapest, Best Value, Most Accounts) dynamically based on JSON data and `valueScore`.                                      |
| **CTA & Links Agent**             | Frontend Dev        | Build View Plan / Buy buttons, fallback logic for affiliate URLs, dynamic labels based on plan type/badge.                                         |
| **Smart Features Agent**          | Fullstack / AI      | Calculate value scores, manage dynamic badges, currency toggles (USD/PHP), notes column, price change badges.                                      |
| **Extra Features Agent**          | Fullstack / DevOps  | Export to CSV, loading skeletons, warnings for outdated data, recommended-for-us column, click tracking, monthly snapshots/versioning.             |
| **Deployment & Automation Agent** | DevOps / Automation | Deploy to Vercel, optional Supabase connection, schedule scraper / cron jobs for price updates, automate agent scripts.                            |

---

### Automated Agent Execution

**1. Data Agent Automation**

* Validate JSON, calculate valueScore, detect price changes.
* Cron: run weekly/monthly.
* Optional: scraper for provider updates.

**2. Smart Features Agent Automation**

* Update badges dynamically based on JSON (`cheapest`, `best value`, `most accounts`).
* Auto-update cards and table indicators when JSON changes.

**3. Extra Features Agent Automation**

* Export table to CSV automatically.
* Check `last_updated` and flag outdated data.

**4. Deployment & Automation Agent**

* Pipeline:

  1. Pull latest code & data.
  2. Run Data Agent scripts.
  3. Run Smart Features scripts.
  4. Build and deploy to Vercel.
* Optional: Use GitHub Actions for automatic updates.

---

### Example Automated Pipeline Flow

```
[Hosting JSON Update]
        │
        ▼
   [Data Agent Script]  ──> validate + valueScore + price change
        │
        ▼
[Smart Features Agent] ──> badges + currency toggle + notes
        │
        ▼
[Table & Filters Agent] ──> refresh table and filters
        │
        ▼
[Cards & Summary Agent] ──> refresh summary cards
        │
        ▼
[Extra Features Agent] ──> export CSV + outdated warnings + click tracking
        │
        ▼
[Deployment Agent] ──> build + deploy to Vercel
```

**Trigger:** Cron job or manual push.

---

### How the Team Uses This

1. Frontend devs → Table, Filters, Cards, CTA, UI polish.
2. Data engineer / AI devs → Data Agent & Smart Features scripts.
3. DevOps → Automation, deployment, cron jobs.
4. All → Review updates or add new providers/types.
