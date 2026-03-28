# ENGINE.md

## Hosting Decision Engine – Orchestrator & Execution Guidelines

This file acts as the **central brain** of the system. It tells Claude Code and developers **how to use Agents.md, scripts, and the overall pipeline**.

---

## 1. Project Overview

Build a **production-ready Hosting Decision Engine Dashboard** using:

* Next.js (App Router)
* Tailwind CSS
* UI-UX promax
* shadcn/ui

The system must:

* Compare hosting providers (Shared, VPS, Dedicated, Cloud, etc.)
* Display pricing, storage, accounts, notes, and last updated
* Highlight Cheapest, Best Value, Most Accounts
* Support billing toggle (monthly/yearly)
* Include CTA buttons (affiliate or direct links)
* Provide summary cards and CSV export

---

## 2. System Architecture

The project is divided into:

* **Agents.md** → defines responsibilities (WHO does the work)
* **/scripts/** → executes logic (HOW the work is done)
* **/data/hosting.json** → source of truth (WHAT data is used)
* **Frontend components** → display results (OUTPUT)

---

## 3. Agent Orchestration Flow

The system must always follow this execution order:

1. Data Agent
2. Smart Features Agent
3. Table & Filters Agent
4. Cards & Summary Agent
5. CTA & Links Agent
6. Extra Features Agent
7. Deployment & Automation Agent

Pipeline Flow:

```
Data → Smart Features → UI (Table/Filters/Cards/CTA) → Extra → Deployment
```

---

## 4. Execution Rules

* Always use `/data/hosting.json` as the **single source of truth**
* No hardcoded values in components
* All computed values (badges, scores, flags) must come from scripts
* Agents must be modular and independent
* Scripts must be runnable individually or via pipeline (`run-agents.js`)

---

## 5. Agent Responsibilities (High-Level)

Refer to `Agents.md` for full breakdown.

* Data Agent → data validation, valueScore, timestamps
* Smart Features Agent → badges, price changes, currency logic
* Frontend Agents → rendering UI from processed data
* Extra Features Agent → CSV, warnings, tracking
* Deployment Agent → build + deploy + automation

---

## 6. Automation & Execution

Primary command:

```
npm run agents
```

This triggers:

1. scripts/data-agent.js
2. scripts/smart-features-agent.js
3. scripts/extra-features-agent.js
4. build
5. deploy

Optional automation:

* Cron jobs (scheduled execution)
* GitHub Actions (CI/CD pipeline)

---

## 7. Claude Code Usage

When using Claude Code:

* DO NOT rebuild the project
* DO NOT overwrite structure
* ALWAYS follow AGENTS.md and this ENGINE.md

Allowed actions:

* Improve agent scripts
* Fix logic errors
* Connect frontend to processed data
* Optimize performance

Example instruction:

```
Follow ENGINE.md and AGENTS.md.
Execute and improve the agent pipeline.
Ensure frontend reflects processed data.
```

---

## 8. Design Principles

* Modular architecture
* Agent-based execution
* Scalable pipeline
* Clean SaaS UI (Stripe / Vercel style)
* Automation-first approach

---

## 9. Key Goal

Transform the dashboard into a:

> **Self-updating Hosting Decision Engine**

Not just a UI, but a system that:

* Processes data
* Generates insights
* Helps make decisions

---

## 10. File Placement

Place this file at:

```
/hosting-decision-engine/ENGINE.md
```

Do NOT merge into Agents.md.

* Agents.md = roles
* Orchestrator.md = execution rules