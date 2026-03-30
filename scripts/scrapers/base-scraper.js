/**
 * Base Scraper — Shared utilities for all provider scrapers.
 * HTTP fetch with retry, HTML parsing, price extraction.
 */

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Fetch a URL with retry and exponential backoff.
 * @param {string} url
 * @param {object} options - Additional fetch options
 * @param {number} retries - Number of retries (default 3)
 * @returns {Promise<string>} Response body text
 */
async function fetchWithRetry(url, options = {}, retries = 3) {
  const delays = [2000, 4000, 8000];
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": randomUA(),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      return await res.text();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise((r) => setTimeout(r, delays[i]));
      }
    }
  }

  throw lastError;
}

/**
 * Parse a price string into a float.
 * Handles: "$2.99/mo", "2.99", "$12,99", "From $7.99", "EUR 4.35"
 * @param {string} text
 * @returns {number|null}
 */
function parsePrice(text) {
  if (!text || typeof text !== "string") return null;

  // Remove common prefixes/suffixes
  let cleaned = text
    .replace(/from\s*/i, "")
    .replace(/starting\s*at\s*/i, "")
    .replace(/\/mo(nth)?/i, "")
    .replace(/\/yr|\/year/i, "")
    .replace(/per\s*month/i, "")
    .replace(/per\s*year/i, "")
    .replace(/USD|EUR|GBP|\$/g, "")
    .replace(/[€£]/g, "")
    .trim();

  // Handle European comma decimal: "2,99" → "2.99"
  if (/^\d+,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(",", ".");
  }

  // Remove thousands separators
  cleaned = cleaned.replace(/,/g, "");

  const match = cleaned.match(/([\d]+\.?\d*)/);
  if (!match) return null;

  const val = parseFloat(match[1]);
  if (isNaN(val) || val <= 0) return null;

  return Math.round(val * 100) / 100;
}

/**
 * Wrap a promise with a timeout.
 * @param {Promise} promise
 * @param {number} ms Timeout in milliseconds
 * @returns {Promise}
 */
function withTimeout(promise, ms = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout after ${ms}ms`)),
      ms
    );
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Load cheerio and parse HTML.
 * @param {string} html
 * @returns {import('cheerio').CheerioAPI}
 */
function loadCheerio(html) {
  const cheerio = require("cheerio");
  return cheerio.load(html);
}

/**
 * Validate a scraped price against the existing known price.
 * Rejects if the new price differs by more than 50% (likely a mis-parse).
 * @param {number} newPrice - Scraped price
 * @param {number} existingPrice - Current known price
 * @returns {boolean}
 */
function validatePrice(newPrice, existingPrice) {
  if (!newPrice || !existingPrice) return !!newPrice;
  const ratio = newPrice / existingPrice;
  return ratio >= 0.5 && ratio <= 2.0;
}

module.exports = {
  fetchWithRetry,
  parsePrice,
  withTimeout,
  loadCheerio,
  validatePrice,
  randomUA,
};
