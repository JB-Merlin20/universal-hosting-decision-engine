"use client";

import {
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Check, X, Star,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertTriangle,
} from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GroupedProvider, HostingProvider, BillingCycle, SortField, SortDirection } from "@/lib/types";
import { calculateYearlyCosts } from "@/lib/types";
import { ProviderLogo } from "@/components/provider-logo";

const PROJECTION_YEARS = [2026, 2027, 2028, 2029] as const;

interface HostingTableProps {
  groups: GroupedProvider[];
  billingCycle: BillingCycle;
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

/** Price display with intro/renewal breakdown and tooltip */
function PriceCell({ plan, billingCycle }: { plan: HostingProvider; billingCycle: BillingCycle }) {
  const introPrice = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
  const renewalPrice = billingCycle === "monthly"
    ? (plan.price_renewal_monthly ?? plan.price_monthly)
    : (plan.price_renewal_yearly ?? plan.price_yearly);
  const hasRenewal = renewalPrice !== introPrice;
  const introDuration = plan.intro_duration_months || 12;
  const renewalRatio = hasRenewal ? renewalPrice / introPrice : 1;
  const suffix = billingCycle === "monthly" ? "/mo" : "/yr";

  const tooltipText = hasRenewal
    ? `Intro price lasts ${introDuration} months, then renews at $${renewalPrice.toFixed(2)}${suffix}`
    : `Price stays at $${introPrice.toFixed(2)}${suffix} — no renewal increase`;

  return (
    <div className="space-y-1 group/price relative">
      <div className="flex items-baseline gap-0.5" title={tooltipText}>
        <span className="text-base font-bold tabular-nums text-foreground">
          ${introPrice.toFixed(2)}
        </span>
        <span className="text-[11px] text-muted-foreground">{suffix}</span>
      </div>
      {hasRenewal && (
        <>
          <p className="text-[10px] text-muted-foreground leading-tight" title={tooltipText}>
            renews at <span className="font-semibold text-foreground/80">${renewalPrice.toFixed(2)}{suffix}</span>
            {" "}after {introDuration}mo
          </p>
          {renewalRatio > 2 && (
            <div className="flex items-center gap-1 mt-0.5">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                {Math.round((renewalRatio - 1) * 100)}% increase after intro
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Expanded row with features and details */
function ExpandedRow({ provider, billingCycle }: { provider: HostingProvider; billingCycle: BillingCycle }) {
  const costs = calculateYearlyCosts(provider);
  const total4yr = PROJECTION_YEARS.reduce((s, y) => s + costs[y], 0);
  const avgMonthly = total4yr / 48;

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

          {/* Right: 4-year cost breakdown */}
          <div>
            <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
              4-Year Cost Projection
            </p>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/50">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Year</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Annual Cost</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Monthly Equiv.</th>
                  </tr>
                </thead>
                <tbody>
                  {PROJECTION_YEARS.map((y) => {
                    const cost = costs[y];
                    return (
                      <tr key={y} className="border-b border-border/30 last:border-0">
                        <td className="px-3 py-2 font-semibold tabular-nums text-foreground">{y}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">${cost.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">${(cost / 12).toFixed(2)}/mo</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 border border-border/50 px-3 py-2">
              <span className="text-[11px] text-muted-foreground font-medium">Total (4 years)</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tabular-nums text-foreground">${total4yr.toFixed(2)}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">avg ${avgMonthly.toFixed(2)}/mo</span>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function HostingTable({ groups, billingCycle, sortField, sortDirection, onSort }: HostingTableProps) {
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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

  // Pre-compute yearly costs for all visible plans to find cheapest per year
  const cheapestPerYear = useMemo(() => {
    const mins: Record<number, number> = {};
    for (const y of PROJECTION_YEARS) mins[y] = Infinity;

    for (const group of groups) {
      const plan = getActivePlan(group);
      const costs = calculateYearlyCosts(plan);
      for (const y of PROJECTION_YEARS) {
        if (costs[y] < mins[y]) mins[y] = costs[y];
      }
    }
    return mins;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, selectedPlans]);

  // Also find cheapest total 4yr
  const cheapestTotal = useMemo(() => {
    let min = Infinity;
    for (const group of groups) {
      const plan = getActivePlan(group);
      const costs = calculateYearlyCosts(plan);
      const total = PROJECTION_YEARS.reduce((s, y) => s + costs[y], 0);
      if (total < min) min = total;
    }
    return min;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, selectedPlans]);

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

              {/* Price column */}
              <th className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                <button onClick={() => onSort("price")} className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150 cursor-pointer">
                  Price <SortIcon field="price" currentField={sortField} direction={sortDirection} />
                </button>
              </th>

              {/* Year projection columns */}
              {PROJECTION_YEARS.map((y) => (
                <th key={y} className="text-center px-2 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums">
                  {y}
                </th>
              ))}

              {/* Total 4yr column */}
              <th className="text-center px-2 py-3 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                Total (4yr)
              </th>

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
          </thead>
          <tbody>
            {paginated.map((group) => {
              const plan = getActivePlan(group);
              const isExpanded = expandedName === group.name;
              const planIdx = selectedPlans[group.name] ?? 0;
              const costs = calculateYearlyCosts(plan);
              const total4yr = PROJECTION_YEARS.reduce((s, y) => s + costs[y], 0);
              const avgMonthly = total4yr / 48;
              const introAnnual = plan.price_yearly ?? plan.price_monthly * 12;

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
                          <ProviderLogo name={group.name} url={plan.url} />
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

                    {/* Price with intro/renewal breakdown */}
                    <td className="px-4 py-3">
                      <PriceCell plan={plan} billingCycle={billingCycle} />
                    </td>

                    {/* Year projection columns (always total annual cost) */}
                    {PROJECTION_YEARS.map((y) => {
                      const cost = costs[y];
                      const isCheapest = cost === cheapestPerYear[y] && cost < Infinity;
                      // Highlight in red if this year's cost is significantly higher than year 1
                      const isExpensive = cost > introAnnual * 1.3;

                      return (
                        <td key={y} className={cn(
                          "px-2 py-3 text-center",
                          isCheapest && "bg-emerald-50/60 dark:bg-emerald-950/20",
                          !isCheapest && isExpensive && "bg-red-50/50 dark:bg-red-950/15"
                        )}>
                          <span className={cn(
                            "text-xs font-bold tabular-nums",
                            isCheapest ? "text-emerald-700 dark:text-emerald-400" : isExpensive ? "text-red-700 dark:text-red-400" : "text-foreground"
                          )}>
                            ${cost.toFixed(0)}
                          </span>
                          {isCheapest && (
                            <div className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                              cheapest
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Total 4yr + avg monthly */}
                    <td className={cn(
                      "px-2 py-3 text-center",
                      total4yr === cheapestTotal && total4yr < Infinity && "bg-emerald-50/60 dark:bg-emerald-950/20"
                    )}>
                      <div className={cn(
                        "text-xs font-bold tabular-nums",
                        total4yr === cheapestTotal && total4yr < Infinity ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                      )}>
                        ${total4yr.toFixed(0)}
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                        avg ${avgMonthly.toFixed(2)}/mo
                      </div>
                      {total4yr === cheapestTotal && total4yr < Infinity && (
                        <div className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                          cheapest
                        </div>
                      )}
                    </td>

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
                  {isExpanded && <ExpandedRow provider={plan} billingCycle={billingCycle} />}
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
