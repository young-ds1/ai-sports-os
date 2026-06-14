#!/bin/bash
set -e
cd /opt/ai-sports-os

pkill -9 -f node 2>/dev/null; sleep 2
git config --global --add safe.directory /opt/ai-sports-os 2>/dev/null
git fetch origin && git reset --hard origin/main
python3 scripts/live-results-scraper.py --write 2>/dev/null || true
python3 scripts/elo-update.py --apply 2>/dev/null || true
python3 scripts/predict-v3.py --apply
cp worldcup-predictions.json apps/web/public/
cp match-results.json apps/web/public/ 2>/dev/null || true
cp events.json apps/web/public/ 2>/dev/null || true
rm -rf apps/web/.next
cd apps/web && npx next build && nohup npx next start -p 3000 > /tmp/next.log 2>&1 &
sleep 10
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
