#!/bin/bash
# AI Sports OS — One-command deploy
# Usage: sudo bash deploy.sh
set -e
cd /opt/ai-sports-os

echo "=== 1. Pull latest code ==="
sudo git fetch origin && sudo git reset --hard origin/main

echo "=== 2. Scrape live match results ==="
sudo python3 scripts/live-results-scraper.py --write || echo "ESPN scrape skipped (no new data)"

echo "=== 3. Run Elo update ==="
sudo python3 scripts/elo-update.py --apply || echo "Elo update skipped"

echo "=== 4. Generate predictions ==="
sudo python3 scripts/predict-v3.py --apply
sudo cp worldcup-predictions.json apps/web/public/
sudo cp match-results.json apps/web/public/ 2>/dev/null
sudo cp events.json apps/web/public/ 2>/dev/null

echo "=== 5. Restart frontend ==="
sudo pkill -f "next dev" 2>/dev/null || true
sleep 1
sudo rm -rf apps/web/.next
cd apps/web && sudo nohup npx next dev -p 3000 > /tmp/next.log 2>&1 &

sleep 5
echo "=== Done ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/
echo " → http://121.40.140.216:3000"
