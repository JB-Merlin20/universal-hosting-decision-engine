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
  valueScore: number;
  priceChange: PriceChange;
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
