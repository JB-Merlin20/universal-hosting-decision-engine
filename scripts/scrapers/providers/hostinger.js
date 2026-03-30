/**
 * Hostinger Price Scraper
 * Scrapes shared, cloud, and VPS hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const PAGES = {
  shared: {
    url: "https://www.hostinger.com/web-hosting",
    plans: [
      { id: "hostinger-single", keywords: ["single"] },
      { id: "hostinger-premium", keywords: ["premium"] },
      { id: "hostinger-business", keywords: ["business"] },
    ],
  },
  cloud: {
    url: "https://www.hostinger.com/cloud-hosting",
    plans: [{ id: "hostinger-cloud-startup", keywords: ["startup", "cloud startup"] }],
  },
  vps: {
    url: "https://www.hostinger.com/vps-hosting",
    plans: [
      { id: "hostinger-vps-1", keywords: ["kvm 1", "kvm1", "1"] },
      { id: "hostinger-vps-2", keywords: ["kvm 2", "kvm2", "2"] },
    ],
  },
};

/**
 * Extract pricing blocks from a page.
 * Tries multiple selector strategies to find plan name + price pairs.
 */
function extractPricingBlocks($, url) {
  const blocks = [];

  // Strategy 1: Look for common pricing card patterns
  const cardSelectors = [
    ".pricing-card", ".plan-card", "[class*='pricing-box']",
    "[class*='plan-card']", "[class*='PricingCard']", "[data-el='pricing-card']",
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const block = $(el);
      const name = block.find("h2, h3, h4, [class*='title'], [class*='name']").first().text().trim().toLowerCase();
      const priceEl = block.find("[class*='price'], [class*='amount'], [class*='cost']").first().text();
      const renewalEl = block.find("[class*='renewal'], [class*='regular'], [class*='renew']").first().text();

      const price = parsePrice(priceEl);
      const renewal = parsePrice(renewalEl);

      if (name && price) {
        blocks.push({ name, price, renewal, source_url: url });
      }
    });
    if (blocks.length > 0) break; // Use first successful strategy
  }

  // Strategy 2: If no cards found, scan for price-like elements near headings
  if (blocks.length === 0) {
    $("h2, h3, h4").each((_, el) => {
      const heading = $(el);
      const name = heading.text().trim().toLowerCase();
      const parent = heading.parent();
      const priceText = parent.find("[class*='price'], [class*='amount']").first().text();
      const price = parsePrice(priceText);

      if (name && price) {
        blocks.push({ name, price, renewal: null, source_url: url });
      }
    });
  }

  return blocks;
}

/**
 * Match extracted pricing blocks to known plan IDs.
 */
function matchPlans(blocks, plans, currentProviders) {
  const results = [];

  for (const plan of plans) {
    const match = blocks.find((b) =>
      plan.keywords.some((kw) => b.name.includes(kw))
    );

    if (match && match.price) {
      // Find existing provider to validate against
      const existing = currentProviders.find((p) => p.id === plan.id);
      const existingPrice = existing ? existing.price_monthly : null;

      if (existingPrice && !validatePrice(match.price, existingPrice)) {
        continue; // Skip — price looks wrong (>50% deviation)
      }

      results.push({
        id: plan.id,
        price_monthly: match.price,
        price_renewal_monthly: match.renewal,
        confidence: match.renewal ? "high" : "medium",
        source_url: match.source_url,
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
      const blocks = extractPricingBlocks($, pageConfig.url);
      const matched = matchPlans(blocks, pageConfig.plans, currentProviders || []);
      allResults.push(...matched);
    } catch (err) {
      console.warn(`  Hostinger ${type} scrape failed: ${err.message}`);
    }
  }

  return allResults;
}

module.exports = { scrape };
