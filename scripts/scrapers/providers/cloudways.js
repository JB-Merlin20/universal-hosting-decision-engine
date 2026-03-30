/**
 * Cloudways Price Scraper
 * Scrapes managed cloud hosting prices.
 */

const { fetchWithRetry, parsePrice, loadCheerio, validatePrice } = require("../base-scraper");

const URL_PRICING = "https://www.cloudways.com/en/pricing.php";

const PLANS = [
  { id: "cloudways-do", keywords: ["1 gb", "1gb"], ram: "1GB" },
  { id: "cloudways-do-2gb", keywords: ["2 gb", "2gb"], ram: "2GB" },
];

async function scrape(currentProviders) {
  const results = [];

  try {
    const html = await fetchWithRetry(URL_PRICING);
    const $ = loadCheerio(html);

    // Cloudways shows pricing in tables or cards organized by cloud provider
    const blocks = [];
    const cardSelectors = [
      ".pricing-card", "[class*='pricing']", "[class*='plan']", "table tr", "[class*='server-row']",
    ];

    for (const sel of cardSelectors) {
      $(sel).each((_, el) => {
        const block = $(el);
        const text = block.text().trim().toLowerCase();
        const priceText = block.find("[class*='price'], .amount, td:nth-child(2)").first().text();
        const price = parsePrice(priceText);
        if (price && text.length < 200) {
          blocks.push({ text, price });
        }
      });
      if (blocks.length > 0) break;
    }

    for (const plan of PLANS) {
      const match = blocks.find((b) =>
        plan.keywords.some((kw) => b.text.includes(kw)) &&
        !results.find((r) => r.id === plan.id) // Avoid duplicates
      );
      if (match && match.price) {
        const existing = (currentProviders || []).find((p) => p.id === plan.id);
        if (existing && !validatePrice(match.price, existing.price_monthly)) continue;
        results.push({
          id: plan.id,
          price_monthly: match.price,
          price_renewal_monthly: match.price, // Cloudways has no intro/renewal split
          confidence: "medium",
          source_url: URL_PRICING,
        });
      }
    }
  } catch (err) {
    console.warn(`  Cloudways scrape failed: ${err.message}`);
  }

  return results;
}

module.exports = { scrape };
