// Hosting Decision Engine - Agent Runner Pipeline

const { execSync } = require("child_process");

const run = (label, command) => {
  console.log(`\n🚀 Running ${label}...`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${label} completed`);
  } catch (error) {
    console.error(`❌ ${label} failed`);
    process.exit(1);
  }
};

// 🔁 AGENT PIPELINE FLOW
// Price Scraper → Data → Smart Features → Extra → (Frontend auto updates) → Deploy

// 0. Price Scraper Agent (fetches live prices — failures are non-blocking)
run("Price Scraper Agent", "node scripts/price-scraper-agent.js");

// 1. Data Agent
run("Data Agent", "node scripts/data-agent.js");

// 2. Smart Features Agent
run("Smart Features Agent", "node scripts/smart-features-agent.js");

// 3. Extra Features Agent
run("Extra Features Agent", "node scripts/extra-features-agent.js");

// 4. Build Project
run("Build App", "cd app && npm run build");

// 5. Deploy (optional — uncomment when ready)
// run("Deploy", "cd app && npx vercel --prod");

console.log("\n🔥 All agents executed successfully!");