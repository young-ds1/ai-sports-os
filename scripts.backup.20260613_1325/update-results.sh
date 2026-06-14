#!/bin/bash
# Update live match results
# Usage:
#   ./scripts/update-results.sh              # Fetch + print summary
#   ./scripts/update-results.sh --post       # Fetch + POST to deployed server
#   ./scripts/update-results.sh --local      # Fetch + write to local public/

set -e
cd "$(dirname "$0")/.."

POST_URL="http://121.40.140.216:3000/api/results/update"

case "${1:-}" in
  --post)
    echo "📡 Fetching live results + posting to $POST_URL..."
    python3 scripts/live-results-scraper.py --post="$POST_URL"
    ;;
  --local)
    echo "📡 Fetching live results + writing to public/..."
    python3 scripts/live-results-scraper.py --write
    ;;
  *)
    echo "📡 Fetching live results (preview only)..."
    python3 scripts/live-results-scraper.py
    ;;
esac
