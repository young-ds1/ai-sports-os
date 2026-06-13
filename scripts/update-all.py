#!/usr/bin/env python3
"""
Unified Results Updater — one-stop pipeline for match results.
1. Scrape live results (ESPN API)
2. Merge with manual entries (manual-results.json)
3. Update Elo ratings
4. Regenerate predictions
5. Update accuracy tracker

Usage:
    python3 scripts/update-all.py                    # Preview
    python3 scripts/update-all.py --apply            # Full pipeline
    python3 scripts/update-all.py --scrape-only      # Just scrape results
"""

import json, math, sys, os, subprocess
from datetime import datetime, timezone
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)


def load_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def scrape_espn():
    """Run the ESPN scraper and return results."""
    scraper = os.path.join(SCRIPT_DIR, 'live-results-scraper.py')
    try:
        result = subprocess.run(
            ['python3', scraper],
            capture_output=True, text=True, timeout=30, cwd=PROJECT_DIR
        )
        # Parse stderr for match summaries
        matches = []
        for line in result.stderr.split('\n'):
            if 'FT' in line or 'LIVE' in line:
                parts = line.strip().split()
                if len(parts) >= 6:
                    matches.append(line.strip())
        # Parse stdout for JSON
        try:
            data = json.loads(result.stdout)
            return data.get('results', data if isinstance(data, list) else [])
        except Exception:
            pass
        return []
    except Exception as e:
        print(f'ESPN scrape failed: {e}', file=sys.stderr)
        return []


def load_manual_results():
    """Load manually entered results that ESPN might miss."""
    paths = [
        os.path.join(PROJECT_DIR, 'manual-results.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'manual-results.json'),
    ]
    for path in paths:
        data = load_json(path)
        if data:
            return data if isinstance(data, list) else data.get('results', [])
    return []


def load_existing_results():
    """Load current match-results.json to preserve existing data."""
    paths = [
        os.path.join(PROJECT_DIR, 'match-results.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'match-results.json'),
    ]
    for path in paths:
        data = load_json(path)
        if data:
            if isinstance(data, dict):
                return data.get('results', [])
            elif isinstance(data, list):
                return data
    return []


def merge_results(existing, scraped, manual):
    """Merge all result sources. Newer wins for same match key."""
    merged = {}
    for r in existing + scraped + manual:
        key = f"{r.get('homeTeam','')}|{r.get('awayTeam','')}|{r.get('date','')}"
        if key in merged:
            # Keep the one with more complete data
            old = merged[key]
            new_score = r.get('homeScore') is not None and r.get('awayScore') is not None
            old_score = old.get('homeScore') is not None and old.get('awayScore') is not None
            if new_score and not old_score:
                merged[key] = r
            elif new_score and old_score:
                # Keep newer
                old_ts = old.get('recordedAt', '')
                new_ts = r.get('recordedAt', '')
                if new_ts > old_ts:
                    merged[key] = r
        else:
            merged[key] = r
    return list(merged.values())


def compute_team_stats(results):
    """Compute per-team stats."""
    stats = {}
    for r in results:
        for side, opp_side in [('homeTeam', 'awayTeam'), ('awayTeam', 'homeTeam')]:
            team = r[side]
            gf = r['homeScore'] if side == 'homeTeam' else r['awayScore']
            ga = r['awayScore'] if side == 'homeTeam' else r['homeScore']
            if team not in stats:
                stats[team] = {'gp': 0, 'gf': 0, 'ga': 0, 'w': 0, 'd': 0, 'l': 0}
            s = stats[team]
            s['gp'] += 1; s['gf'] += gf; s['ga'] += ga
            if gf > ga: s['w'] += 1
            elif gf == ga: s['d'] += 1
            else: s['l'] += 1
    for team, s in stats.items():
        gp = max(s['gp'], 1)
        s['gpg'] = round(s['gf'] / gp, 2)
        s['gapg'] = round(s['ga'] / gp, 2)
    return stats


def main():
    apply_flag = '--apply' in sys.argv
    scrape_only = '--scrape-only' in sys.argv

    print('═══ Results Updater ═══')

    # 1. Scrape
    print('\n1. Scraping ESPN...')
    scraped = scrape_espn()
    print(f'   ESPN: {len(scraped)} matches')

    # 2. Load manual
    manual = load_manual_results()
    if manual:
        print(f'   手动: {len(manual)} matches')

    # 3. Merge
    existing = load_existing_results()
    merged = merge_results(existing, scraped, manual)
    print(f'   合并: {len(merged)} matches (was {len(existing)})')

    # 4. Build output
    team_stats = compute_team_stats(merged)
    output = {
        'description': 'World Cup 2026 match results. Auto-updated.',
        'lastUpdated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': 'ESPN API + manual entry',
        'results': sorted(merged, key=lambda x: x.get('date', '')),
        'teamStats': team_stats,
    }

    # Show results
    for r in output['results']:
        status = r.get('status', r.get('clock', '?'))
        print(f"   {r['date']} {r['homeTeam']} {r['homeScore']}-{r['awayScore']} {r['awayTeam']} [{status}]")

    if apply_flag:
        # Write to both locations
        pub_path = os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'match-results.json')
        root_path = os.path.join(PROJECT_DIR, 'match-results.json')
        save_json(pub_path, output)
        save_json(root_path, output)
        print(f'\n✅ match-results.json updated ({len(merged)} matches)')

        if not scrape_only:
            # Run Elo update
            print('\n2. Elo update...')
            elo_script = os.path.join(SCRIPT_DIR, 'elo-update.py')
            result = subprocess.run(
                ['python3', elo_script, '--apply'],
                capture_output=True, text=True, timeout=30, cwd=PROJECT_DIR
            )
            for line in result.stdout.split('\n'):
                if line.strip():
                    print(f'   {line.strip()}')
            if result.stderr:
                for line in result.stderr.split('\n'):
                    if line.strip():
                        print(f'   [err] {line.strip()}', file=sys.stderr)
    else:
        print('\n(使用 --apply 应用变更, --scrape-only 仅爬取)')


if __name__ == '__main__':
    main()
