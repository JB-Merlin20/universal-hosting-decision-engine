"use client";

import { useState, useMemo } from "react";
import hostingData from "@/data/hosting-data.json";
import { Sidebar } from "@/components/sidebar";
import { SummaryCards } from "@/components/summary-cards";
import { FiltersBar } from "@/components/filters-bar";
import { HostingTable } from "@/components/hosting-table";
import { ThemeToggle } from "@/components/theme-toggle";
import type {
  HostingData,
  HostingProvider,
  GroupedProvider,
  BillingCycle,
  SortField,
  SortDirection,
} from "@/lib/types";
import { calculateYearlyCosts } from "@/lib/types";

const data = hostingData as HostingData;

function parseStorageGB(storage: string): number {
  if (!storage) return 0;
  const lower = storage.toLowerCase();
  if (lower.includes("unlimited")) return 99999;
  const match = lower.match(/([\d.]+)\s*(tb|gb)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return match[2] === "tb" ? val * 1000 : val;
}

function parseAccounts(accounts: number | string): number {
  if (typeof accounts === "number") return accounts;
  if (typeof accounts === "string" && accounts.toLowerCase() === "unlimited") return 99999;
  return 1;
}

function groupProviders(providers: HostingProvider[]): GroupedProvider[] {
  const map = new Map<string, HostingProvider[]>();
  for (const p of providers) {
    const existing = map.get(p.name) || [];
    existing.push(p);
    map.set(p.name, existing);
  }
  return Array.from(map.entries()).map(([name, plans]) => {
    plans.sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return a.price_monthly - b.price_monthly;
    });
    return {
      name,
      plans,
      activePlan: plans[0],
      bestRank: Math.min(...plans.map((p) => p.rank)),
      hasRecommended: plans.some((p) => p.recommended),
      types: [...new Set(plans.map((p) => p.type))],
    };
  });
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const groups = useMemo(() => {
    let providers = [...data.providers] as HostingProvider[];

    if (search) {
      const q = search.toLowerCase();
      providers = providers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.plan.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      providers = providers.filter((p) => p.type === typeFilter);
    }

    const grouped = groupProviders(providers);

    grouped.sort((a, b) => {
      const ap = a.plans[0];
      const bp = b.plans[0];
      let cmp = 0;
      switch (sortField) {
        case "rank":
          cmp = a.bestRank - b.bestRank;
          break;
        case "price": {
          const aP = billingCycle === "monthly" ? ap.price_monthly : ap.price_yearly;
          const bP = billingCycle === "monthly" ? bp.price_monthly : bp.price_yearly;
          cmp = aP - bP;
          break;
        }
        case "valueScore":
          cmp = ap.valueScore - bp.valueScore;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "storage":
          cmp = parseStorageGB(ap.storage) - parseStorageGB(bp.storage);
          break;
        case "accounts":
          cmp = parseAccounts(ap.accounts) - parseAccounts(bp.accounts);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return grouped;
  }, [search, typeFilter, billingCycle, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "valueScore" || field === "storage" || field === "accounts" ? "desc" : "asc");
    }
  }

  function handleExportCSV() {
    const projYears = [2026, 2027, 2028, 2029];
    const yearHeaders = projYears.map((y) => `${y} Total ($)`);
    const headers = ["Provider", "Plan", "Type", "Intro Price ($/mo)", "Renewal Price ($/mo)", ...yearHeaders, "Total 4yr ($)", "Avg Monthly ($)", "Storage", "Accounts", "Uptime SLA", "Value Score", "Badges", "URL"];
    const rows: string[] = [];
    for (const g of groups) {
      for (const p of g.plans) {
        const costs = calculateYearlyCosts(p);
        const yearCosts = projYears.map((y) => costs[y]);
        const total4yr = yearCosts.reduce((s, c) => s + c, 0);
        const avgMonthly = (total4yr / 48).toFixed(2);
        rows.push([
          p.name, p.plan, p.type, p.price_monthly, p.price_renewal_monthly || p.price_monthly,
          ...yearCosts, total4yr.toFixed(2), avgMonthly,
          p.storage, p.accounts, `${p.uptime_guarantee}%`,
          p.valueScore, p.badges.join("; "), p.url
        ].join(","));
      }
    }
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hosting-comparison-4yr-${typeFilter === "all" ? "all" : typeFilter.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        providers={data.providers as HostingProvider[]}
        summary={data.summary}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        processedAt={data._meta.processed_at as string}
      />

      <main className="flex-1 min-w-0 overflow-auto">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">Dashboard</h2>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="bg-muted px-2 py-0.5 rounded-md">{data.summary.hosting_types.length} types</span>
                <span className="bg-muted px-2 py-0.5 rounded-md">{groups.length} providers</span>
                <span className="bg-muted px-2 py-0.5 rounded-md">{data.summary.total_providers} plans</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline text-[11px] text-muted-foreground">
                Updated {new Date(data._meta.processed_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 w-full">
          <SummaryCards providers={data.providers as HostingProvider[]} summary={data.summary} />

          <FiltersBar
            search={search}
            onSearchChange={setSearch}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            onExportCSV={handleExportCSV}
            totalResults={groups.length}
            activeFilter={typeFilter}
          />

          <HostingTable
            groups={groups}
            billingCycle={billingCycle}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          <footer className="text-center py-6 text-[11px] text-muted-foreground/60 border-t border-border/50">
            <p>Hosting Decision Engine -- Data-driven hosting comparisons.</p>
            <p className="mt-1">
              Projected costs 2026-2029. Last verified {new Date(data._meta.processed_at as string).toLocaleDateString()}. Prices may vary by region.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
