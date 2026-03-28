"use client";

import { Search, Download, SlidersHorizontal, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/lib/types";

interface FiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  billingCycle: BillingCycle;
  onBillingCycleChange: (value: BillingCycle) => void;
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  availableYears: number[];
  onExportCSV: () => void;
  totalResults: number;
  activeFilter: string;
}

export function FiltersBar({
  search,
  onSearchChange,
  billingCycle,
  onBillingCycleChange,
  selectedYears,
  onToggleYear,
  availableYears,
  onExportCSV,
  totalResults,
  activeFilter,
}: FiltersBarProps) {
  return (
    <div className="space-y-3">
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

      {/* Year multi-select pills */}
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
          Compare years:
        </span>
        <div className="inline-flex rounded-lg border border-input bg-muted/50 p-0.5 gap-0.5">
          {availableYears.map((y) => {
            const isActive = selectedYears.includes(y);
            return (
              <button
                key={y}
                onClick={() => onToggleYear(y)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer tabular-nums",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {y}
              </button>
            );
          })}
        </div>
        {selectedYears.length > 1 && (
          <span className="text-[10px] text-primary font-medium bg-primary/10 rounded-full px-2 py-0.5">
            Comparing {selectedYears.length} years
          </span>
        )}
      </div>
    </div>
  );
}
