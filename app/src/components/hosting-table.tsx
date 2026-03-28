"use client";

import {
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Check, X, Star,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GroupedProvider, HostingProvider, BillingCycle, SortField, SortDirection } from "@/lib/types";

interface HostingTableProps {
  groups: GroupedProvider[];
  billingCycle: BillingCycle;
  selectedYears: number[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const badgeConfig: Record<string, { label: string; variant: "success" | "info" | "warning" | "purple" }> = {
  cheapest: { label: "Cheapest", variant: "success" },
  "best-value": { label: "Best Value", variant: "info" },
  "most-accounts": { label: "Most Accounts", variant: "purple" },
  "best-uptime": { label: "Best Uptime", variant: "info" },
  "price-drop": { label: "Price Drop", variant: "success" },
  "price-increase": { label: "Price Up", variant: "warning" },
  recommended: { label: "Recommended", variant: "purple" },
};

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (field !== currentField) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />;
  return direction === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
}

function ValueBar({ score }: { score: number }) {
  const color = score >= 70 ? "from-emerald-500 to-emerald-400" : score >= 40 ? "from-blue-500 to-blue-400" : "from-orange-500 to-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-300`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-6 text-foreground">{score}</span>
    </div>
  );
}

function getYearPrice(provider: HostingProvider, year: number, cycle: BillingCycle): number {
  const yp = provider.price_history?.[String(year)];
  if (yp) return cycle === "monthly" ? yp.monthly : yp.yearly;
  return cycle === "monthly" ? provider.price_monthly : provider.price_yearly;
}

/** YoY delta badge between two years */
function YoYDelta({ provider, yearA, yearB, cycle }: { provider: HostingProvider; yearA: number; yearB: number; cycle: BillingCycle }) {
  const priceA = getYearPrice(provider, yearA, cycle);
  const priceB = getYearPrice(provider, yearB, cycle);
  if (priceA === priceB) return <Minus className="h-3 w-3 text-muted-foreground/40 mx-auto" />;
  const diff = priceB - priceA;
  const pct = Math.abs((diff / priceA) * 100).toFixed(0);
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <TrendingDown className="h-3 w-3" />
        {pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
      <TrendingUp className="h-3 w-3" />
      {pct}%
    </span>
  );
}

function MiniSparkline({ provider, selectedYears }: { provider: HostingProvider; selectedYears: number[] }) {
  const history = provider.price_history;
  if (!history) return null;
  const allYears = [2023, 2024, 2025, 2026];
  const prices = allYears.map((y) => history[String(y)]?.monthly).filter((p): p is number => p != null);
  if (prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const h = 20;
  const w = 48;
  const points = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" points={points} />
      {allYears.map((y, i) => {
        if (!selectedYears.includes(y)) return null;
        const p = history[String(y)]?.monthly;
        if (p == null) return null;
        const cx = (i / (allYears.length - 1)) * w;
        const cy = h - ((p - min) / range) * h;
        return <circle key={y} cx={cx} cy={cy} r="2.5" className="fill-primary" />;
      })}
    </svg>
  );
}

/** Expanded row with multi-year comparison table */
function ExpandedRow({ provider, billingCycle, selectedYears }: { provider: HostingProvider; billingCycle: BillingCycle; selectedYears: number[] }) {
  const allYears = [2023, 2024, 2025, 2026];
  return (
    <tr className="border-b border-border/30">
      <td colSpan={100} className="px-5 py-5 bg-muted/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          {/* Left: Features + Details */}
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Features</p>
              <ul className="space-y-1.5">
                {provider.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { label: "Bandwidth", value: provider.bandwidth },
                  { label: "Free Domain", value: provider.free_domain ? <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : <X className="h-4 w-4 text-muted-foreground/30" /> },
                  { label: "Free SSL", value: provider.free_ssl ? <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : <X className="h-4 w-4 text-muted-foreground/30" /> },
                  { label: "Uptime SLA", value: `${provider.uptime_guarantee}%` },
                  { label: "Support", value: provider.support },
                ].map((item) => (
                  <Fragment key={item.label}>
                    <span className="text-muted-foreground text-xs">{item.label}</span>
                    <span className="font-medium text-foreground text-xs">{item.value}</span>
                  </Fragment>
                ))}
              </div>
            </div>
            <p className="text-foreground/70 text-xs leading-relaxed">{provider.notes}</p>
          </div>

          {/* Right: Year-by-year comparison table */}
          <div>
            <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              Price Comparison Across Years
            </p>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Year</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Monthly</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Yearly</th>
                    <th className="text-center px-3 py-2 font-semibold text-muted-foreground">YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {allYears.map((y, i) => {
                    const yp = provider.price_history?.[String(y)];
                    if (!yp) return null;
                    const isSelected = selectedYears.includes(y);
                    const prevYp = i > 0 ? provider.price_history?.[String(allYears[i - 1])] : null;
                    let yoyEl: React.ReactNode = <Minus className="h-3 w-3 text-muted-foreground/30 mx-auto" />;
                    if (prevYp) {
                      const diff = yp.monthly - prevYp.monthly;
                      const pct = Math.abs((diff / prevYp.monthly) * 100).toFixed(1);
                      if (diff < 0) yoyEl = <span className="text-emerald-600 dark:text-emerald-400 font-semibold">-{pct}%</span>;
                      else if (diff > 0) yoyEl = <span className="text-amber-600 dark:text-amber-400 font-semibold">+{pct}%</span>;
                    }
                    return (
                      <tr key={y} className={cn(
                        "border-b border-border/30 last:border-0 transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted/30"
                      )}>
                        <td className={cn("px-3 py-2 font-semibold tabular-nums", isSelected ? "text-primary" : "text-foreground")}>{y}</td>
                        <td className={cn("px-3 py-2 text-right tabular-nums", isSelected ? "text-primary font-semibold" : "text-foreground")}>${yp.monthly.toFixed(2)}</td>
                        <td className={cn("px-3 py-2 text-right tabular-nums", isSelected ? "text-primary font-semibold" : "text-foreground")}>${yp.yearly.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">{yoyEl}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total change across selected years */}
            {selectedYears.length >= 2 && (() => {
              const sorted = [...selectedYears].sort();
              const first = sorted[0];
              const last = sorted[sorted.length - 1];
              const firstP = provider.price_history?.[String(first)]?.monthly;
              const lastP = provider.price_history?.[String(last)]?.monthly;
              if (firstP == null || lastP == null) return null;
              const totalDiff = lastP - firstP;
              const totalPct = ((totalDiff / firstP) * 100).toFixed(1);
              return (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 border border-border/50 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground font-medium">{first} vs {last}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">${firstP.toFixed(2)} &rarr; ${lastP.toFixed(2)}</span>
                    <span className={cn(
                      "text-xs font-bold tabular-nums",
                      totalDiff < 0 ? "text-emerald-600 dark:text-emerald-400" : totalDiff > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    )}>
                      {totalDiff < 0 ? "" : "+"}{totalPct}%
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function HostingTable({ groups, billingCycle, selectedYears, sortField, sortDirection, onSort }: HostingTableProps) {
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const sortedYears = useMemo(() => [...selectedYears].sort(), [selectedYears]);
  const isComparing = sortedYears.length > 1;

  const totalPages = Math.ceil(groups.length / pageSize);
  const paginated = useMemo(() => groups.slice(page * pageSize, (page + 1) * pageSize), [groups, page, pageSize]);

  const groupCount = groups.length;
  const [prevCount, setPrevCount] = useState(groupCount);
  if (groupCount !== prevCount) {
    setPrevCount(groupCount);
    if (page !== 0) setPage(0);
  }

  const startItem = groups.length === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, groups.length);

  function getActivePlan(group: GroupedProvider): HostingProvider {
    const idx = selectedPlans[group.name] ?? 0;
    return group.plans[idx] || group.plans[0];
  }

  // Dynamic columns based on how many years selected
  const priceColSpan = isComparing ? sortedYears.length * 2 - 1 : 1; // years + delta arrows between them

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                <button onClick={() => onSort("rank")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150 cursor-pointer">
                  # <SortIcon field="rank" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                <button onClick={() => onSort("name")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150 cursor-pointer">
                  Provider <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Plan</th>

              {/* Dynamic price columns */}
              {isComparing ? (
                <th colSpan={priceColSpan} className="text-center px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                  <button onClick={() => onSort("price")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150 cursor-pointer">
                    Price Comparison <SortIcon field="price" currentField={sortField} direction={sortDirection} />
                  </button>
                </th>
              ) : (
                <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                  <button onClick={() => onSort("price")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150 cursor-pointer">
                    Price ({sortedYears[0]}) <SortIcon field="price" currentField={sortField} direction={sortDirection} />
                  </button>
                </th>
              )}

              <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                <button onClick={() => onSort("storage")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150 cursor-pointer">
                  Storage <SortIcon field="storage" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                <button onClick={() => onSort("valueScore")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150 cursor-pointer">
                  Value <SortIcon field="valueScore" currentField={sortField} direction={sortDirection} />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Action</th>
            </tr>

            {/* Sub-header for year labels when comparing */}
            {isComparing && (
              <tr className="border-b border-border/30 bg-muted/30">
                <th colSpan={3} />
                {sortedYears.map((y, i) => (
                  <Fragment key={y}>
                    <th className="text-center px-2 py-1.5 text-[10px] font-bold text-primary tabular-nums">{y}</th>
                    {i < sortedYears.length - 1 && (
                      <th className="text-center px-1 py-1.5 text-[9px] text-muted-foreground/60 font-normal">vs</th>
                    )}
                  </Fragment>
                ))}
                <th colSpan={3} />
              </tr>
            )}
          </thead>
          <tbody>
            {paginated.map((group) => {
              const plan = getActivePlan(group);
              const isExpanded = expandedName === group.name;
              const planIdx = selectedPlans[group.name] ?? 0;

              return (
                <Fragment key={group.name}>
                  <tr
                    className={cn(
                      "group border-b border-border/30 hover:bg-muted/40 transition-colors duration-150 cursor-pointer",
                      group.hasRecommended && "bg-primary/[0.03] dark:bg-primary/[0.06]",
                      isExpanded && "bg-muted/30"
                    )}
                    onClick={() => setExpandedName(isExpanded ? null : group.name)}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold",
                        group.bestRank <= 3 ? "bg-primary/10 text-primary dark:bg-primary/20" : "bg-muted text-muted-foreground"
                      )}>
                        {group.bestRank}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{group.name}</span>
                          {group.hasRecommended && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.types.map((t) => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 leading-4 font-normal">{t}</Badge>)}
                        </div>
                        {plan.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {plan.badges.map((b) => { const c = badgeConfig[b]; return c ? <Badge key={b} variant={c.variant} className="text-[10px] px-1.5 py-0 leading-4">{c.label}</Badge> : null; })}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Plan selector */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {group.plans.length === 1 ? (
                        <span className="text-xs text-foreground/70">{plan.plan}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {group.plans.map((p, i) => (
                            <button key={p.id} onClick={() => setSelectedPlans((s) => ({ ...s, [group.name]: i }))}
                              className={cn("text-[11px] px-2 py-1 rounded-md transition-colors duration-150 cursor-pointer border",
                                i === planIdx ? "bg-primary text-primary-foreground border-primary font-medium" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                              )}>
                              {p.plan}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Price column(s) */}
                    {isComparing ? (
                      // Multi-year: price cells with delta arrows between
                      sortedYears.map((y, i) => (
                        <Fragment key={y}>
                          <td className="px-2 py-3 text-center">
                            <div className="text-xs font-bold tabular-nums text-foreground">
                              ${getYearPrice(plan, y, billingCycle).toFixed(2)}
                            </div>
                          </td>
                          {i < sortedYears.length - 1 && (
                            <td className="px-1 py-3 text-center">
                              <YoYDelta provider={plan} yearA={sortedYears[i]} yearB={sortedYears[i + 1]} cycle={billingCycle} />
                            </td>
                          )}
                        </Fragment>
                      ))
                    ) : (
                      // Single year
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-base font-bold tabular-nums text-foreground">${getYearPrice(plan, sortedYears[0], billingCycle).toFixed(2)}</span>
                            <span className="text-[11px] text-muted-foreground ml-0.5">{billingCycle === "monthly" ? "/mo" : "/yr"}</span>
                          </div>
                          <MiniSparkline provider={plan} selectedYears={sortedYears} />
                        </div>
                      </td>
                    )}

                    {/* Storage */}
                    <td className="px-4 py-3 text-foreground/70 text-xs">{plan.storage}</td>

                    {/* Value */}
                    <td className="px-4 py-3"><ValueBar score={plan.valueScore} /></td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant={plan.recommended ? "default" : "outline"} className="h-8 text-xs"
                          onClick={(e) => { e.stopPropagation(); window.open(plan.affiliate_url || plan.url, "_blank"); }}>
                          View Plan <ExternalLink className="h-3 w-3" />
                        </Button>
                        <span className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && <ExpandedRow provider={plan} billingCycle={billingCycle} selectedYears={sortedYears} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No providers match your filters.</p>
          <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Showing <span className="font-semibold text-foreground tabular-nums">{startItem}-{endItem}</span> of{" "}
              <span className="font-semibold text-foreground tabular-nums">{groups.length}</span> providers
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {[10, 20, 50].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(0)} disabled={page === 0} aria-label="First page"><ChevronsLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-xs font-medium px-3 tabular-nums text-foreground">{page + 1} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} aria-label="Last page"><ChevronsRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
