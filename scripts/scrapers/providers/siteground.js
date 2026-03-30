/**
 * SiteGround Price Scraper
 * Scrapes shared and cloud hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const PAGES = {
  shared: {
    url: "https://www.siteground.com/web-hosting.htm",
    plans: [
      { id: "siteground-startup", keywords: ["startup", "start up"] },
      { id: "siteground-growbig", keywords: ["growbig", "grow big"] },
      { id: "siteground-gogeek", keywords: ["gogeek", "go geek"] },
    ],
  },
  cloud: {
    url: "https://www.siteground.com/cloud-hosting.htm",
    plans: [
      { id: "siteground-cloud-entry", keywords: ["jump start", "entry", "cloud"] },
    ],
  },
};

function extractAndMatch($, plans, url, currentProviders) {
  const results = [];
  const cardSelectors = [
    ".pricing-box", ".plan-box", ".pricing-card", "[class*='pricing']",
    "[class*='plan-card']", "[class*='PricingCard']",
  ];

  const blocks = [];
  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const block = $(el);
      const name = block.find("h2, h3, h4, [class*='title'], [class*='name']").first().text().trim().toLowerCase();
      const priceText = block.find("[class*='price'], .amount, [class*='cost']").first().text();
      const renewalText = block.find("[class*='renewal'], .regular-price, [class*='renews'], [class*='regular']").first().text();
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
      console.warn(`  SiteGround ${type} scrape failed: ${err.message}`);
    }
  }

  return allResults;
}

module.exports = { scrape };
