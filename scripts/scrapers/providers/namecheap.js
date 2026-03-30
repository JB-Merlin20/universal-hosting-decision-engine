/**
 * Namecheap Price Scraper
 * Scrapes shared hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const PLANS = [
  { id: "namecheap-stellar", keywords: ["stellar"] },
  { id: "namecheap-stellar-plus", keywords: ["stellar plus"] },
  { id: "namecheap-stellar-business", keywords: ["stellar business"] },
];

const URL_SHARED = "https://www.namecheap.com/hosting/shared/";

async function scrape(currentProviders) {
  const results = [];

  try {
    const html = await fetchWithRetry(URL_SHARED);
    const $ = loadCheerio(html);

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

    for (const plan of PLANS) {
      // Match order matters: "stellar business" before "stellar plus" before "stellar"
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
    console.warn(`  Namecheap scrape failed: ${err.message}`);
  }

  return results;
}

module.exports = { scrape };
