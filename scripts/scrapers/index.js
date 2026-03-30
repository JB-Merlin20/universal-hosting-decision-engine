/**
 * Scraper Registry & Orchestrator
 * Loads all provider scraper modules and runs them in parallel.
 */

const fs = require("fs");
const path = require("path");
const { withTimeout } = require("./base-scraper");

const PROVIDERS_DIR = path.join(__dirname, "providers");
const SCRAPE_TIMEOUT = 30000; // 30s per provider group

/**
 * Load all provider scraper modules from the providers/ directory.
 * Each module must export { scrape: async () => ScrapedResult[] }
 */
function loadScrapers() {
  const scrapers = [];
  const files = fs.readdirSync(PROVIDERS_DIR).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    try {
      const mod = require(path.join(PROVIDERS_DIR, file));
      if (typeof mod.scrape === "function") {
        scrapers.push({
          name: file.replace(".js", ""),
          scrape: mod.scrape,
        });
      }
    } catch (err) {
      console.warn(`  Warning: Failed to load scraper ${file}: ${err.message}`);
    }
  }

  return scrapers;
}

/**
 * Run all scrapers in parallel with timeout protection.
 * @param {Array} currentProviders - Current provider data from hosting.json
 * @returns {Promise<{results: Map<string, object>, report: object}>}
 */
async function scrapeAll(currentProviders) {
  const scrapers = loadScrapers();
  const results = new Map();
  const report = {
    run_at: new Date().toISOString(),
    total: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    providers: [],
  };

  console.log(`  Found ${scrapers.length} scraper modules`);

  const outcomes = await Promise.allSettled(
    scrapers.map(async (scraper) => {
      try {
        const scraped = await withTimeout(
          scraper.scrape(currentProviders),
          SCRAPE_TIMEOUT
        );
        return { name: scraper.name, data: scraped, error: null };
      } catch (err) {
        return { name: scraper.name, data: [], error: err.message };
      }
    })
  );

  for (const outcome of outcomes) {
    const { name, data, error } =
      outcome.status === "fulfilled"
        ? outcome.value
        : { name: "unknown", data: [], error: outcome.reason?.message };

    if (error) {
      console.warn(`  FAILED: ${name} — ${error}`);
      report.providers.push({
        scraper: name,
        status: "failed",
        error,
        ids: [],
      });
      continue;
    }

    for (const item of data) {
      if (!item || !item.id || item.price_monthly === null) {
        report.skipped++;
        continue;
      }

      results.set(item.id, item);
      report.total++;
      report.succeeded++;
      report.providers.push({
        id: item.id,
        status: "success",
        price_monthly: item.price_monthly,
        price_renewal_monthly: item.price_renewal_monthly || null,
        confidence: item.confidence || "medium",
        source_url: item.source_url || "",
      });
    }
  }

  // Count failures as provider-level
  const failedScrapers = outcomes.filter(
    (o) =>
      o.status === "rejected" ||
      (o.status === "fulfilled" && o.value.error)
  );
  report.failed = failedScrapers.length;

  return { results, report };
}

module.exports = { scrapeAll, loadScrapers };
