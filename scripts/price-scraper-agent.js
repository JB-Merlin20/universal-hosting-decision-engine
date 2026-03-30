/**
 * Price Scraper Agent — Hosting Decision Engine
 * Orchestrates price scraping from provider websites, merges results into hosting.json.
 * Runs BEFORE the data-agent in the pipeline.
 *
 * Exit code is always 0 — partial failures are acceptable.
 * Failed providers keep their existing prices.
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.resolve(__dirname, "../data/hosting.json");
const REPORT_PATH = path.resolve(__dirname, "../data/scrape-report.json");
const PREV_REPORT_PATH = REPORT_PATH;

function loadData() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function loadPreviousReport() {
  try {
    if (fs.existsSync(PREV_REPORT_PATH)) {
      const raw = fs.readFileSync(PREV_REPORT_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

async function run() {
  console.log("Price Scraper Agent: Starting...");

  const data = loadData();
  const previousReport = loadPreviousReport();
  const today = new Date().toISOString().split("T")[0];

  // Dynamically load the scraper orchestrator and price validator
  const { scrapeAll } = require("./scrapers/index");
  const { validatePrice } = require("./scrapers/base-scraper");

  console.log(`  Scraping prices for ${data.providers.length} providers...`);
  const { results, report } = await scrapeAll(data.providers);

  let updatedCount = 0;
  let unchangedCount = 0;
  let failedCount = 0;

  // Merge scraped results into hosting.json
  data.providers = data.providers.map((provider) => {
    const scraped = results.get(provider.id);

    if (!scraped || scraped.price_monthly === null) {
      failedCount++;
      return provider; // Keep existing data
    }

    // Reject if scraped price deviates >50% from known price (likely mis-parse)
    if (provider.price_monthly && !validatePrice(scraped.price_monthly, provider.price_monthly)) {
      console.warn(`  Rejected ${provider.id}: scraped $${scraped.price_monthly} vs existing $${provider.price_monthly} (>50% deviation)`);
      failedCount++;
      return provider;
    }

    const priceChanged = scraped.price_monthly !== provider.price_monthly;
    const renewalChanged =
      scraped.price_renewal_monthly &&
      scraped.price_renewal_monthly !== provider.price_renewal_monthly;

    if (!priceChanged && !renewalChanged) {
      unchangedCount++;
      // Still update metadata
      return {
        ...provider,
        price_fetch_method: "auto",
        price_fetched_at: new Date().toISOString(),
        last_updated: today,
      };
    }

    updatedCount++;

    // Shift current price to previous_price before updating
    const updated = {
      ...provider,
      previous_price: provider.price_monthly,
      price_monthly: scraped.price_monthly,
      last_updated: today,
      price_fetch_method: "auto",
      price_fetched_at: new Date().toISOString(),
    };

    // Update yearly price if available
    if (scraped.price_yearly) {
      updated.price_yearly = scraped.price_yearly;
    } else {
      updated.price_yearly = Math.round(scraped.price_monthly * 12 * 100) / 100;
    }

    // Update renewal pricing
    if (scraped.price_renewal_monthly) {
      updated.price_renewal_monthly = scraped.price_renewal_monthly;
    }
    if (scraped.price_renewal_yearly) {
      updated.price_renewal_yearly = scraped.price_renewal_yearly;
    }

    return updated;
  });

  // Track consecutive failures
  if (previousReport && previousReport.providers) {
    const prevFailMap = new Map();
    for (const p of previousReport.providers) {
      if (p.status === "failed") {
        prevFailMap.set(p.id || p.scraper, p.consecutive_failures || 1);
      }
    }

    for (const entry of report.providers) {
      if (entry.status === "failed") {
        const prevCount = prevFailMap.get(entry.id || entry.scraper) || 0;
        entry.consecutive_failures = prevCount + 1;
      } else {
        entry.consecutive_failures = 0;
      }
    }
  }

  // Write updated hosting.json
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

  // Write scrape report
  report.summary = {
    updated: updatedCount,
    unchanged: unchangedCount,
    failed: failedCount,
    total_providers: data.providers.length,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`  Results:`);
  console.log(`    Updated: ${updatedCount}`);
  console.log(`    Unchanged: ${unchangedCount}`);
  console.log(`    Failed/Skipped: ${failedCount}`);
  console.log(`  Report saved: ${REPORT_PATH}`);
  console.log("Price Scraper Agent: Done.");

  // Always exit 0 — partial failure is OK
  process.exit(0);
}

run().catch((err) => {
  console.error(`Price Scraper Agent: Fatal error: ${err.message}`);
  console.error(err.stack);
  // Still exit 0 to not block the pipeline
  process.exit(0);
});
