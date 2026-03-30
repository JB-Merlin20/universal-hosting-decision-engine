/**
 * GoDaddy Price Scraper
 * Scrapes shared hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const URL_SHARED = "https://www.godaddy.com/hosting/web-hosting";

const PLANS = [
  { id: "godaddy-economy", keywords: ["economy"] },
  { id: "godaddy-deluxe", keywords: ["deluxe"] },
  { id: "godaddy-ultimate", keywords: ["ultimate"] },
];

async function scrape(currentProviders) {
  const results = [];

  try {
    const html = await fetchWithRetry(URL_SHARED);
    const $ = loadCheerio(html);

    const blocks = [];
    const cardSelectors = [
      ".pricing-card", "[class*='pricing']", "[class*='plan']",
      "[class*='product']", "[class*='offer']",
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

    for (const plan of PLANS) {
      const match = blocks.find((b) => plan.keywords.some((kw) => b.name.includes(kw)));
      if (match && match.price) {
        const existing = (currentProviders || []).find((p) => p.id === plan.id);
        if (existing && !validatePrice(match.price, existing.price_monthly)) continue;
        results.push({
          id: plan.id,
          price_monthly: match.price,
          price_renewal_monthly: match.renewal,
          confidence: match.renewal ? "high" : "medium",
          source_url: URL_SHARED,
        });
      }
    }
  } catch (err) {
    console.warn(`  GoDaddy scrape failed: ${err.message}`);
  }

  return results;
}

module.exports = { scrape };
