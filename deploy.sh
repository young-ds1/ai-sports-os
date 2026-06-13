#!/bin/bash
# AI Sports OS — Production Deploy
# One command: sudo bash /opt/deploy.sh
set -e

echo "=== Deploy AI Sports OS ==="

# 0. Kill ALL node/next processes
echo "0. Cleanup..."
sudo pkill -9 -f "node" 2>/dev/null || true
sleep 2

# 1. Pull latest code
echo "1. Git pull..."
cd /opt/ai-sports-os
sudo git config --global --add safe.directory /opt/ai-sports-os 2>/dev/null || true
sudo git fetch origin && sudo git reset --hard origin/main

# 2. Scrape live results
echo "2. Scrape results..."
sudo python3 scripts/live-results-scraper.py --write 2>/dev/null || echo "   (scrape skipped)"

# 3. Elo update
echo "3. Elo update..."
sudo python3 scripts/elo-update.py --apply 2>/dev/null || echo "   (elo skipped)"

# 4. Generate predictions
echo "4. Generate predictions..."
sudo python3 scripts/predict-v3.py --apply
sudo cp worldcup-predictions.json apps/web/public/
sudo cp match-results.json apps/web/public/ 2>/dev/null || true
sudo cp events.json apps/web/public/ 2>/dev/null || true

# 5. Build + Start
echo "5. Build & Start..."
cd apps/web
sudo rm -rf .next
sudo npx next build
sudo nohup npx next start -p 3000 > /tmp/next.log 2>&1 &

sleep 8
echo ""
echo "=== Verify ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
echo ""
echo "Done → http://121.40.140.216:3000"
