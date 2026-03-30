/**
 * Extra Features Agent — Hosting Decision Engine
 * CSV export, outdated data warnings, snapshots.
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../data/hosting-processed.json");
const CSV_PATH = path.resolve(__dirname, "../data/hosting-export.csv");
const SNAPSHOT_DIR = path.resolve(__dirname, "../data/snapshots");
const FRONTEND_PATH = path.resolve(
  __dirname,
  "../app/src/data/hosting-data.json"
);

function loadData() {
  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  return JSON.parse(raw);
}

function csvCell(val) {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportCSV(providers) {
  const headers = [
    "Rank",
    "Provider",
    "Plan",
    "Type",
    "Monthly Price (USD)",
    "Yearly Price (USD)",
    "Renewal Monthly (USD)",
    "Renewal Yearly (USD)",
    "Yearly Savings",
    "Storage",
    "Bandwidth",
    "Accounts",
    "Free Domain",
    "Free SSL",
    "Uptime",
    "Support",
    "Value Score",
    "Badges",
    "Price Source",
    "Notes",
    "Last Updated",
  ];

  const rows = providers.map((p) => [
    p.rank,
    csvCell(p.name),
    csvCell(p.plan),
    csvCell(p.type),
    p.price_monthly,
    p.price_yearly,
    p.price_renewal_monthly || "",
    p.price_renewal_yearly || "",
    p.yearly_savings || 0,
    csvCell(p.storage),
    csvCell(p.bandwidth),
    csvCell(String(p.accounts)),
    p.free_domain ? "Yes" : "No",
    p.free_ssl ? "Yes" : "No",
    `${p.uptime_guarantee}%`,
    csvCell(p.support),
    p.valueScore,
    csvCell((p.badges || []).join("; ")),
    p.price_fetch_method || "manual",
    csvCell(p.notes || ""),
    p.last_updated,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  fs.writeFileSync(CSV_PATH, csv);
}

function checkOutdated(providers) {
  const now = new Date();
  const warnings = [];

  providers.forEach((p) => {
    if (!p.last_updated) {
      warnings.push({ id: p.id, name: p.name, reason: "No last_updated date" });
      p._outdated = true;
      return;
    }
    const updated = new Date(p.last_updated);
    const daysSince = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      warnings.push({
        id: p.id,
        name: p.name,
        reason: `${daysSince} days since last update`,
      });
      p._outdated = true;
    } else {
      p._outdated = false;
      p._days_since_update = daysSince;
    }
  });

  return warnings;
}

function createSnapshot(data) {
  if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const date = new Date().toISOString().split("T")[0];
  const snapPath = path.join(SNAPSHOT_DIR, `snapshot-${date}.json`);
  fs.writeFileSync(snapPath, JSON.stringify(data, null, 2));
  return snapPath;
}

function copyToFrontend(data) {
  const dir = path.dirname(FRONTEND_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Strip internal/debug fields to reduce frontend bundle size
  const stripped = {
    ...data,
    providers: data.providers.map((p) => {
      const { _validated, _processed_at, _outdated, _days_since_update, previous_price, ...rest } = p;
      return rest;
    }),
    _meta: {
      processed_at: data._meta.processed_at,
      available_years: data._meta.available_years,
    },
    summary: data.summary,
  };
  fs.writeFileSync(FRONTEND_PATH, JSON.stringify(stripped));
}

function run() {
  console.log("📦 Extra Features Agent: Starting...");

  const data = loadData();

  // CSV Export
  exportCSV(data.providers);
  console.log(`  ✅ CSV exported to ${CSV_PATH}`);

  // Outdated warnings
  const warnings = checkOutdated(data.providers);
  if (warnings.length > 0) {
    console.log(`  ⚠ ${warnings.length} outdated provider(s):`);
    warnings.forEach((w) => console.log(`    - ${w.name}: ${w.reason}`));
  } else {
    console.log("  ✅ All providers up to date");
  }
  data._meta.warnings = warnings;

  // Snapshot
  const snapPath = createSnapshot(data);
  console.log(`  ✅ Snapshot saved: ${snapPath}`);

  // Save final processed data
  fs.writeFileSync(INPUT_PATH, JSON.stringify(data, null, 2));

  // Copy to frontend
  copyToFrontend(data);
  console.log(`  ✅ Frontend data updated: ${FRONTEND_PATH}`);
}

run();
