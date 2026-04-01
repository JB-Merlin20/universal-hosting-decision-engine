export interface PriceChange {
  changed: boolean;
  direction?: "up" | "down";
  amount?: string;
  percentage?: number;
}

export interface YearPrice {
  monthly: number;
  yearly: number;
}

export interface PriceHistory {
  [year: string]: YearPrice;
}

export interface HostingProvider {
  id: string;
  name: string;
  plan: string;
  type: string;
  price_monthly: number;
  price_yearly: number;
  price_renewal_monthly?: number;
  price_renewal_yearly?: number;
  intro_duration_months?: number;
  currency: string;
  storage: string;
  bandwidth: string;
  accounts: number | string;
  free_domain: boolean;
  free_ssl: boolean;
  uptime_guarantee: number;
  support: string;
  features: string[];
  url: string;
  affiliate_url: string;
  recommended: boolean;
  notes: string;
  last_updated: string;
  price_fetch_method?: "auto" | "manual";
  price_fetched_at?: string;
  valueScore: number;
  priceChange: PriceChange;
  renewal_premium?: { monthly_delta: number; percentage: number } | null;
  yearly_savings: number;
  badges: string[];
  rank: number;
  price_history: PriceHistory;
}

/** A provider grouped by name, with multiple plan entries */
export interface GroupedProvider {
  name: string;
  plans: HostingProvider[];
  /** The currently selected/active plan */
  activePlan: HostingProvider;
  /** Best rank among plans */
  bestRank: number;
  /** Whether any plan is recommended */
  hasRecommended: boolean;
  /** All unique types across plans */
  types: string[];
}

export interface Summary {
  total_providers: number;
  hosting_types: string[];
  average_monthly_price: number;
  price_range: { min: number; max: number };
  cheapest: string | null;
  best_value: string | null;
  most_accounts: string | null;
  providers_with_price_changes: number;
}

export interface HostingData {
  providers: HostingProvider[];
  summary: Summary;
  _meta: Record<string, unknown>;
}

export type BillingCycle = "monthly" | "yearly";
export type SortField =
  | "rank"
  | "price"
  | "valueScore"
  | "name"
  | "storage"
  | "accounts";
export type SortDirection = "asc" | "desc";

export interface YearlyCosts {
  /** Total annual cost for each year (2026-2029) */
  [year: number]: number;
}

/**
 * Calculate total annual costs for a plan over 4 years (2026-2029).
 *
 * Logic:
 * - During intro period: use intro (current) price × 12
 * - After intro period: use renewal price × 12 (or intro price if no renewal)
 * - For yearly billing: use price_yearly during intro, price_renewal_yearly after
 * - Handles partial intro years (e.g. intro ends mid-year)
 */
export function calculateYearlyCosts(plan: HostingProvider): YearlyCosts {
  const introYearly = plan.price_yearly ?? plan.price_monthly * 12;
  const renewalMonthly = plan.price_renewal_monthly ?? plan.price_monthly;
  const renewalYearly = plan.price_renewal_yearly ?? renewalMonthly * 12;
  const introDuration = plan.intro_duration_months ?? 12;

  // Per-month rates derived from yearly prices for consistency
  const introPerMonth = introYearly / 12;
  const renewalPerMonth = renewalYearly / 12;

  const costs: YearlyCosts = {};

  for (let i = 0; i < 4; i++) {
    const year = 2026 + i;
    const monthStart = i * 12; // month 0 = start of 2026

    if (monthStart >= introDuration) {
      // Entire year is at renewal price
      costs[year] = Math.round(renewalYearly * 100) / 100;
    } else if (monthStart + 12 <= introDuration) {
      // Entire year is at intro price
      costs[year] = Math.round(introYearly * 100) / 100;
    } else {
      // Partial: some months intro, some renewal (use per-month from yearly rates)
      const introMonths = introDuration - monthStart;
      const renewalMonths = 12 - introMonths;
      costs[year] = Math.round((introPerMonth * introMonths + renewalPerMonth * renewalMonths) * 100) / 100;
    }
  }

  return costs;
}
