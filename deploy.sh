#!/bin/bash
# AI Sports OS Deploy
set -e
cd /opt/ai-sports-os

# 1. Kill everything on port 3000
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo pkill -9 -f "next" 2>/dev/null || true
sleep 2

# 2. Pull latest code
git config --global --add safe.directory /opt/ai-sports-os 2>/dev/null || true
sudo git fetch origin && sudo git reset --hard origin/main

# 3. Regenerate data
python3 scripts/live-results-scraper.py --write 2>/dev/null || true
python3 scripts/elo-update.py --apply 2>/dev/null || true
python3 scripts/predict-v3.py --apply
cp worldcup-predictions.json apps/web/public/
cp match-results.json apps/web/public/ 2>/dev/null || true
cp events.json apps/web/public/ 2>/dev/null || true

# 4. Clean + Start dev server
rm -rf apps/web/.next
cd apps/web
sudo nohup npx next dev -p 3000 > /tmp/next.log 2>&1 &

# 5. Wait and verify
sleep 8
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
echo "HTTP $CODE → http://121.40.140.216:3000"
