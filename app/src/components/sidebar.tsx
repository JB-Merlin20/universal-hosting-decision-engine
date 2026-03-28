"use client";

import {
  LayoutDashboard,
  Server,
  Cloud,
  HardDrive,
  Share2,
  Globe,
  Shield,
  TrendingDown,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Activity,
  PieChart,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostingProvider, Summary } from "@/lib/types";

const typeIcons: Record<string, React.ElementType> = {
  Shared: Server,
  Cloud: Cloud,
  VPS: HardDrive,
  "Managed Cloud": Shield,
  Dedicated: Globe,
  Reseller: Share2,
};

interface SidebarProps {
  providers: HostingProvider[];
  summary: Summary;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  processedAt: string;
}

export function Sidebar({
  providers,
  summary,
  typeFilter,
  onTypeFilterChange,
  collapsed,
  onToggleCollapse,
  processedAt,
}: SidebarProps) {
  const typeCounts = providers.reduce(
    (acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const priceDrops = providers.filter(
    (p) => p.priceChange?.changed && p.priceChange.direction === "down"
  );
  const priceUps = providers.filter(
    (p) => p.priceChange?.changed && p.priceChange.direction === "up"
  );
  const recommended = providers.filter((p) => p.recommended);
  const avgUptime =
    providers.reduce((s, p) => s + (p.uptime_guarantee || 0), 0) /
    providers.length;

  const navItems = [
    {
      label: "All Providers",
      value: "all",
      icon: LayoutDashboard,
      count: providers.length,
    },
    ...summary.hosting_types.map((type) => ({
      label: type,
      value: type,
      icon: typeIcons[type] || Server,
      count: typeCounts[type] || 0,
    })),
  ];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border/50 bg-card transition-all duration-200 h-screen sticky top-0 z-40",
        collapsed ? "w-[68px]" : "w-[272px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Activity className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-[13px] font-bold tracking-tight truncate text-foreground">
              Hosting Engine
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none">
              Decision Dashboard
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Categories
          </p>
        )}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = typeFilter === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onTypeFilterChange(item.value)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    <span
                      className={cn(
                        "ml-auto text-[11px] tabular-nums rounded-md px-1.5 py-0.5 font-semibold",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.count}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Insights */}
        {!collapsed && (
          <div className="mt-6 space-y-3 px-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Quick Insights
            </p>

            {/* Market overview */}
            <div className="rounded-lg border border-border/50 bg-background p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <PieChart className="h-3.5 w-3.5 text-primary" />
                Market Overview
              </div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Providers</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {summary.total_providers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Price</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    ${summary.average_monthly_price}/mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Range</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    ${summary.price_range.min} - ${summary.price_range.max}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Uptime</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {avgUptime.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Price movements */}
            <div className="rounded-lg border border-border/50 bg-background p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Price Movement
              </div>
              <div className="space-y-1.5 text-[12px]">
                {priceDrops.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {priceDrops.length} price drop
                      {priceDrops.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {priceUps.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {priceUps.length} price increase
                      {priceUps.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {priceDrops.length === 0 && priceUps.length === 0 && (
                  <span className="text-muted-foreground">
                    No recent changes
                  </span>
                )}
              </div>
            </div>

            {/* Recommended */}
            {recommended.length > 0 && (
              <div className="rounded-lg border border-border/50 bg-background p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Our Picks ({recommended.length})
                </div>
                <div className="space-y-1.5 text-[12px]">
                  {recommended.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span className="text-muted-foreground truncate mr-2">
                        {p.name}
                      </span>
                      <span className="font-semibold text-foreground shrink-0 tabular-nums">
                        ${p.price_monthly}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-2 py-2 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-3 py-1 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Updated {new Date(processedAt).toLocaleDateString()}
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150 cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
