/**
 * Bluehost Price Scraper
 * Scrapes shared and VPS hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const PAGES = {
  shared: {
    url: "https://www.bluehost.com/hosting/shared",
    plans: [
      { id: "bluehost-basic", keywords: ["basic"] },
      { id: "bluehost-plus", keywords: ["plus"] },
      { id: "bluehost-choiceplus", keywords: ["choice plus", "choice+"] },
      { id: "bluehost-pro", keywords: ["pro"] },
    ],
  },
  vps: {
    url: "https://www.bluehost.com/hosting/vps",
    plans: [
      { id: "bluehost-vps-standard", keywords: ["standard", "vps"] },
    ],
  },
};

function extractAndMatch($, plans, url, currentProviders) {
  const results = [];
  const blocks = [];
  const cardSelectors = [
    ".pricing-card", ".plan-card", "[class*='pricing-box']",
    "[class*='pricing']", "[class*='plan']",
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
      console.warn(`  Bluehost ${type} scrape failed: ${err.message}`);
    }
  }

  return allResults;
}

module.exports = { scrape };
