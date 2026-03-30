/**
 * Data Agent — Hosting Decision Engine
 * Validates JSON, calculates valueScore, generates price_history, detects price changes.
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.resolve(__dirname, "../data/hosting.json");
const OUTPUT_PATH = path.resolve(__dirname, "../data/hosting-processed.json");

function loadData() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function validateProvider(p, index) {
  const required = ["id", "name", "plan", "type", "price_monthly", "currency"];
  const missing = required.filter((f) => p[f] === undefined || p[f] === "");
  if (missing.length > 0) {
    console.warn(`  Warning: Provider #${index} (${p.name || "unknown"}) missing: ${missing.join(", ")}`);
    return false;
  }
  if (typeof p.price_monthly !== "number" || p.price_monthly < 0) {
    console.warn(`  Warning: Provider "${p.name}" has invalid price_monthly: ${p.price_monthly}`);
    return false;
  }
  return true;
}

function calculateValueScore(provider, allProviders) {
  const prices = allProviders.map((p) => p.price_monthly);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  const priceRange = maxPrice - minPrice || 1;
  const priceScore = ((maxPrice - provider.price_monthly) / priceRange) * 40;

  const storageGB = parseStorageGB(provider.storage);
  const allStorage = allProviders.map((p) => parseStorageGB(p.storage));
  const maxStorage = Math.max(...allStorage);
  const storageScore = maxStorage > 0 ? (storageGB / maxStorage) * 25 : 0;

  const accts = parseAccounts(provider.accounts);
  const allAccts = allProviders.map((p) => parseAccounts(p.accounts));
  const maxAccts = Math.max(...allAccts);
  const accountsScore = maxAccts > 0 ? (accts / maxAccts) * 20 : 0;

  const uptime = provider.uptime_guarantee || 99;
  const uptimeScore = Math.min(((uptime - 99) / 1) * 15, 15);

  return Math.round(priceScore + storageScore + accountsScore + uptimeScore);
}

function parseStorageGB(storage) {
  if (!storage || typeof storage !== "string") return 0;
  const lower = storage.toLowerCase();
  if (lower.includes("unlimited")) return 1000;
  const match = lower.match(/([\d.]+)\s*(tb|gb)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return match[2] === "tb" ? val * 1000 : val;
}

function parseAccounts(accounts) {
  if (typeof accounts === "number") return accounts;
  if (typeof accounts === "string" && accounts.toLowerCase() === "unlimited") return 500;
  return 1;
}

/**
 * Generate price_history based on real data only.
 * Only includes years where we have actual price data (previous_price → 2025, current → 2026).
 * No synthetic/random data is generated.
 */
function generatePriceHistory(provider) {
  if (provider.price_history) return provider.price_history;

  const current = provider.price_monthly;
  const history = {};

  // Only include 2025 if we have a real previous_price that differs from current
  if (provider.previous_price !== undefined && provider.previous_price !== current) {
    history["2025"] = {
      monthly: provider.previous_price,
      yearly: Math.round(provider.previous_price * 12 * 100) / 100,
    };
  }

  // 2026 = current price (always present)
  history["2026"] = {
    monthly: current,
    yearly: provider.price_yearly || Math.round(current * 12 * 100) / 100,
  };

  return history;
}

/**
 * Compute renewal premium if renewal pricing data is available.
 */
function computeRenewalPremium(provider) {
  if (provider.price_renewal_monthly && provider.price_renewal_monthly !== provider.price_monthly) {
    const delta = Math.round((provider.price_renewal_monthly - provider.price_monthly) * 100) / 100;
    const pct = Math.round(((provider.price_renewal_monthly - provider.price_monthly) / provider.price_monthly) * 100);
    return { monthly_delta: delta, percentage: pct };
  }
  return null;
}

function detectPriceChange(provider) {
  if (provider.previous_price !== undefined && provider.previous_price !== provider.price_monthly) {
    const diff = provider.price_monthly - provider.previous_price;
    const pct = ((diff / provider.previous_price) * 100).toFixed(1);
    return {
      changed: true,
      direction: diff < 0 ? "down" : "up",
      amount: Math.abs(diff).toFixed(2),
      percentage: Math.abs(parseFloat(pct)),
    };
  }
  return { changed: false };
}

function run() {
  console.log("Data Agent: Starting...");

  const data = loadData();
  let validCount = 0;

  data.providers = data.providers.map((provider, i) => {
    const valid = validateProvider(provider, i);
    if (valid) validCount++;

    const valueScore = calculateValueScore(provider, data.providers);
    const priceChange = detectPriceChange(provider);
    const price_yearly = provider.price_yearly || provider.price_monthly * 12;
    const yearly_savings = Math.round((provider.price_monthly * 12 - price_yearly) * 100) / 100;
    const price_history = generatePriceHistory(provider);
    const renewal_premium = computeRenewalPremium(provider);

    return {
      ...provider,
      valueScore,
      priceChange,
      price_yearly,
      yearly_savings,
      price_history,
      renewal_premium,
      _validated: valid,
      _processed_at: new Date().toISOString(),
    };
  });

  data._meta = {
    total_providers: data.providers.length,
    valid_providers: validCount,
    processed_at: new Date().toISOString(),
    agent: "data-agent",
    version: "2.0.0",
    available_years: [2025, 2026],
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`  Validated ${validCount}/${data.providers.length} providers`);
  console.log(`  Value scores calculated`);
  console.log(`  Price history generated (2025-2026, real data only)`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

run();
