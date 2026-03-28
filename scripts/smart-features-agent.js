/**
 * Smart Features Agent — Hosting Decision Engine
 * Assigns badges (cheapest, best value, most accounts), manages rankings.
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../data/hosting-processed.json");
const OUTPUT_PATH = INPUT_PATH; // overwrite in place

function loadData() {
  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  return JSON.parse(raw);
}

function parseAccounts(accounts) {
  if (typeof accounts === "number") return accounts;
  if (typeof accounts === "string" && accounts.toLowerCase() === "unlimited")
    return Infinity;
  return 1;
}

function assignBadges(providers) {
  // Clear old badges
  providers.forEach((p) => (p.badges = []));

  // Cheapest (monthly)
  const cheapest = [...providers].sort(
    (a, b) => a.price_monthly - b.price_monthly
  )[0];
  if (cheapest) cheapest.badges.push("cheapest");

  // Best Value (highest valueScore)
  const bestValue = [...providers].sort(
    (a, b) => (b.valueScore || 0) - (a.valueScore || 0)
  )[0];
  if (bestValue) bestValue.badges.push("best-value");

  // Most Accounts
  const mostAccounts = [...providers].sort(
    (a, b) => parseAccounts(b.accounts) - parseAccounts(a.accounts)
  )[0];
  if (mostAccounts) mostAccounts.badges.push("most-accounts");

  // Best Uptime
  const bestUptime = [...providers].sort(
    (a, b) => (b.uptime_guarantee || 0) - (a.uptime_guarantee || 0)
  )[0];
  if (bestUptime && bestUptime.uptime_guarantee >= 99.99)
    bestUptime.badges.push("best-uptime");

  // Price Drop
  providers.forEach((p) => {
    if (p.priceChange && p.priceChange.changed && p.priceChange.direction === "down") {
      p.badges.push("price-drop");
    }
    if (p.priceChange && p.priceChange.changed && p.priceChange.direction === "up") {
      p.badges.push("price-increase");
    }
  });

  // Recommended
  providers.forEach((p) => {
    if (p.recommended) p.badges.push("recommended");
  });

  return providers;
}

function assignRankings(providers) {
  // Rank by value score
  const ranked = [...providers].sort(
    (a, b) => (b.valueScore || 0) - (a.valueScore || 0)
  );
  ranked.forEach((p, i) => (p.rank = i + 1));
  return providers;
}

function generateSummary(providers) {
  const types = [...new Set(providers.map((p) => p.type))];
  const avgPrice =
    providers.reduce((s, p) => s + p.price_monthly, 0) / providers.length;
  const priceRange = {
    min: Math.min(...providers.map((p) => p.price_monthly)),
    max: Math.max(...providers.map((p) => p.price_monthly)),
  };

  return {
    total_providers: providers.length,
    hosting_types: types,
    average_monthly_price: Math.round(avgPrice * 100) / 100,
    price_range: priceRange,
    cheapest: providers.find((p) => p.badges?.includes("cheapest"))?.id || null,
    best_value:
      providers.find((p) => p.badges?.includes("best-value"))?.id || null,
    most_accounts:
      providers.find((p) => p.badges?.includes("most-accounts"))?.id || null,
    providers_with_price_changes: providers.filter(
      (p) => p.priceChange?.changed
    ).length,
  };
}

function run() {
  console.log("🧠 Smart Features Agent: Starting...");

  const data = loadData();

  // Assign badges
  data.providers = assignBadges(data.providers);
  console.log("  ✅ Badges assigned");

  // Assign rankings
  data.providers = assignRankings(data.providers);
  console.log("  ✅ Rankings calculated");

  // Generate summary
  data.summary = generateSummary(data.providers);
  console.log("  ✅ Summary generated");

  // Update metadata
  data._meta = {
    ...data._meta,
    smart_features_at: new Date().toISOString(),
    agent: "smart-features-agent",
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log("  ✅ Output saved");
}

run();
