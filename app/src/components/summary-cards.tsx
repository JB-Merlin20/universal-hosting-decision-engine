"use client";

import {
  DollarSign,
  Trophy,
  TrendingDown,
  Shield,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { HostingProvider, Summary } from "@/lib/types";

interface SummaryCardsProps {
  providers: HostingProvider[];
  summary: Summary;
}

export function SummaryCards({ providers, summary }: SummaryCardsProps) {
  const cheapest = providers.find((p) => p.badges?.includes("cheapest"));
  const bestValue = providers.find((p) => p.badges?.includes("best-value"));
  const priceDrops = providers.filter((p) => p.badges?.includes("price-drop"));
  const avgUptime =
    providers.reduce((s, p) => s + (p.uptime_guarantee || 0), 0) /
    providers.length;
  const freeSSLCount = providers.filter((p) => p.free_ssl).length;

  const cards = [
    {
      title: "Cheapest Plan",
      icon: DollarSign,
      value: cheapest ? `$${cheapest.price_monthly}` : "N/A",
      suffix: "/mo",
      subtitle: cheapest ? `${cheapest.name} - ${cheapest.plan}` : "",
      accent: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    },
    {
      title: "Best Value Score",
      icon: Trophy,
      value: bestValue ? `${bestValue.valueScore}` : "N/A",
      suffix: "/100",
      subtitle: bestValue ? `${bestValue.name} - ${bestValue.plan}` : "",
      accent: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
    },
    {
      title: "Price Drops",
      icon: TrendingDown,
      value: `${priceDrops.length}`,
      suffix: ` of ${providers.length}`,
      subtitle:
        priceDrops.length > 0
          ? "Saving opportunity detected"
          : "No recent price drops",
      accent:
        priceDrops.length > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground",
      iconBg:
        priceDrops.length > 0
          ? "bg-emerald-500/10 dark:bg-emerald-500/15"
          : "bg-muted",
    },
    {
      title: "Avg. Uptime SLA",
      icon: Shield,
      value: `${avgUptime.toFixed(1)}`,
      suffix: "%",
      subtitle: `${freeSSLCount} providers include free SSL`,
      accent: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
    },
    {
      title: "Total Providers",
      icon: BarChart3,
      value: `${summary.total_providers}`,
      suffix: "",
      subtitle: `${summary.hosting_types.length} hosting types tracked`,
      accent: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
    },
    {
      title: "Avg. Monthly Price",
      icon: DollarSign,
      value: `$${summary.average_monthly_price}`,
      suffix: "/mo",
      subtitle: `Range: $${summary.price_range.min} - $${summary.price_range.max}`,
      accent: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-500/10 dark:bg-orange-500/15",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="group relative overflow-hidden border-border/50 hover:border-border hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`text-2xl font-bold tabular-nums ${card.accent}`}
                  >
                    {card.value}
                  </span>
                  {card.suffix && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {card.suffix}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {card.subtitle}
                </p>
              </div>
              <div
                className={`rounded-lg p-2.5 ${card.iconBg} shrink-0 group-hover:scale-110 transition-transform duration-200`}
              >
                <card.icon className={`h-5 w-5 ${card.accent}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
