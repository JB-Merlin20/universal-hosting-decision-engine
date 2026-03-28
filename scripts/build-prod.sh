#!/bin/bash
# Production build script — minimizes deployment size
# Usage: bash scripts/build-prod.sh

set -e

echo "🔧 Production Build: Starting..."

# 1. Run agent pipeline to generate fresh data
echo "  → Running agent pipeline..."
cd app && npm run agents && cd ..

# 2. Build Next.js (standalone mode)
echo "  → Building Next.js app..."
cd app && npm run build && cd ..

# 3. Clean build cache (not needed for deployment)
echo "  → Cleaning build cache..."
rm -rf app/.next/cache

# 4. Reinstall without devDependencies
echo "  → Pruning devDependencies..."
cd app && npm prune --omit=dev && cd ..

# 5. Report sizes
echo ""
echo "📊 Production size report:"
echo "  Standalone bundle: $(du -sh app/.next/standalone 2>/dev/null | cut -f1 || echo 'N/A')"
echo "  Static assets:     $(du -sh app/.next/static 2>/dev/null | cut -f1 || echo 'N/A')"
echo "  node_modules:      $(du -sh app/node_modules 2>/dev/null | cut -f1 || echo 'N/A')"
echo ""
echo "✅ Production build complete."
echo "   Deploy: app/.next/standalone + app/.next/static + app/public"
