"use client";

import { Search, Download, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BillingCycle } from "@/lib/types";

interface FiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  billingCycle: BillingCycle;
  onBillingCycleChange: (value: BillingCycle) => void;
  onExportCSV: () => void;
  totalResults: number;
  activeFilter: string;
}

export function FiltersBar({
  search,
  onSearchChange,
  billingCycle,
  onBillingCycleChange,
  onExportCSV,
  totalResults,
  activeFilter,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Active filter */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          {activeFilter === "all" ? "All Providers" : activeFilter}
        </span>
        <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 tabular-nums font-medium">
          {totalResults}
        </span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-full sm:w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search providers..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm bg-background"
        />
      </div>

      {/* Billing toggle */}
      <div className="inline-flex rounded-lg border border-input bg-muted/50 p-0.5">
        <button
          onClick={() => onBillingCycleChange("monthly")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
            billingCycle === "monthly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onBillingCycleChange("yearly")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
            billingCycle === "yearly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yearly
        </button>
      </div>

      {/* Export */}
      <Button variant="outline" size="sm" onClick={onExportCSV} className="h-9">
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
    </div>
  );
}
