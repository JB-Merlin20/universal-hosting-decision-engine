/**
 * DreamHost Price Scraper
 * Scrapes shared and VPS hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const PAGES = {
  shared: {
    url: "https://www.dreamhost.com/hosting/shared/",
    plans: [
      { id: "dreamhost-starter", keywords: ["starter", "shared starter"] },
      { id: "dreamhost-unlimited", keywords: ["unlimited", "shared unlimited"] },
    ],
  },
  vps: {
    url: "https://www.dreamhost.com/hosting/vps/",
    plans: [
      { id: "dreamhost-vps-basic", keywords: ["basic", "vps basic", "1 gb"] },
    ],
  },
};

function extractAndMatch($, plans, url, currentProviders) {
  const results = [];
  const blocks = [];
  const cardSelectors = [
    ".pricing-card", ".plan-card", "[class*='pricing']", "[class*='plan']",
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const block = $(el);
      const name = block.find("h2, h3, h4, [class*='title'], [class*='name']").first().text().trim().toLowerCase();
      const priceText = block.find("[class*='price'], .amount, [class*='cost']").first().text();
      const renewalText = block.find("[class*='renewal'], [class*='regular'], [class*='renew']").first().text();
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
      console.warn(`  DreamHost ${type} scrape failed: ${err.message}`);
    }
  }

  return allResults;
}

module.exports = { scrape };
