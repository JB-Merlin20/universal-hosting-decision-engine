/**
 * A2 Hosting Price Scraper
 * Scrapes shared and VPS hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const PAGES = {
  shared: {
    url: "https://www.a2hosting.com/web-hosting",
    plans: [
      { id: "a2hosting-startup", keywords: ["startup", "start up"] },
      { id: "a2hosting-drive", keywords: ["drive"] },
      { id: "a2hosting-turboboost", keywords: ["turbo boost", "turboboost"] },
      { id: "a2hosting-turbomax", keywords: ["turbo max", "turbomax"] },
    ],
  },
  vps: {
    url: "https://www.a2hosting.com/vps-hosting",
    plans: [
      { id: "a2hosting-vps-runway1", keywords: ["runway 1", "runway1"] },
      { id: "a2hosting-vps-runway2", keywords: ["runway 2", "runway2"] },
    ],
  },
};

function extractAndMatch($, plans, url, currentProviders) {
  const results = [];
  const blocks = [];
  const cardSelectors = [
    ".pricing-card", ".plan-card", "[class*='pricing']", "[class*='plan-box']",
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const block = $(el);
      const name = block.find("h2, h3, h4, [class*='title'], [class*='name']").first().text().trim().toLowerCase();
      const priceText = block.find("[class*='price'], .amount").first().text();
      const renewalText = block.find("[class*='renewal'], [class*='regular']").first().text();
      const price = parsePrice(priceText);
      const renewal = parsePrice(renewalText);
      if (name && price) blocks.push({ name, price, renewal });
    });
    if (blocks.length > 0) break;
  }

  for (const plan of plans) {
    const match = blocks.find((b) => plan.keywords.some((kw) => b.name.includes(kw)));
    if (match && match.price) {
      const existing = (currentProviders || []).find((p) => p.id === plan.id);
      if (existing && !validatePrice(match.price, existing.price_monthly)) continue;
      results.push({
        id: plan.id,
        price_monthly: match.price,
        price_renewal_monthly: match.renewal,
        confidence: match.renewal ? "high" : "medium",
        source_url: url,
      });
    }
  }

  return results;
}

async function scrape(currentProviders) {
  const allResults = [];

  for (const [type, pageConfig] of Object.entries(PAGES)) {
    try {
      const html = await fetchWithRetry(pageConfig.url);
      const $ = loadCheerio(html);
      const matched = extractAndMatch($, pageConfig.plans, pageConfig.url, currentProviders);
      allResults.push(...matched);
    } catch (err) {
      console.warn(`  A2 Hosting ${type} scrape failed: ${err.message}`);
    }
  }

  return allResults;
}

module.exports = { scrape };
