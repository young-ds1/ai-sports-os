#!/usr/bin/env python3
"""
Elo Dynamic Update Pipeline
After each match result, updates Elo ratings and regenerates predictions.
Idempotent: tracks which matches have already been processed.

Usage:
    python3 scripts/elo-update.py                    # Preview changes
    python3 scripts/elo-update.py --apply            # Apply + write files
    python3 scripts/elo-update.py --watch            # Poll match-results.json every 60s
"""

import json, math, sys, os, time
from datetime import datetime, timezone
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# Optimal model parameters (from calibration)
PARAMS = {'BASELINE': 1.0, 'HOME_FACTOR': 1.2, 'ATTACK_SPREAD': 1.1, 'DEFENSE_SPREAD': 0.5}
K_FACTOR = 32  # Elo K-factor (group stage)
HOME_ADV = 40  # Elo home advantage points

# Initial Elo ratings
INITIAL_ELO = {
    "Argentina": 2138, "France": 2112, "Brazil": 2098, "England": 2085,
    "Spain": 2070, "Germany": 2055, "Portugal": 2040, "Netherlands": 2025,
    "Belgium": 2005, "Uruguay": 1990, "Croatia": 1980, "Colombia": 1970,
    "Morocco": 1960, "Senegal": 1950, "Japan": 1945, "Iran": 1940,
    "USA": 1935, "Mexico": 1930, "Austria": 1925, "Sweden": 1920,
    "Turkey": 1915, "Ecuador": 1910, "Egypt": 1905, "South Korea": 1900,
    "Australia": 1895, "Canada": 1890, "Ivory Coast": 1885,
    "Saudi Arabia": 1875, "Qatar": 1870, "Tunisia": 1865, "Scotland": 1860,
    "Paraguay": 1855, "Norway": 1850, "Algeria": 1845, "Ghana": 1840,
    "Iraq": 1835, "Panama": 1830, "South Africa": 1825, "Czech Republic": 1820,
    "Cape Verde": 1815, "Curaçao": 1810, "Haiti": 1805, "New Zealand": 1800,
    "Jordan": 1795, "Uzbekistan": 1785, "DR Congo": 1780,
    "Bosnia & Herzegovina": 1845, "Switzerland": 1975,
}


def load_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_elo():
    """Load current Elo ratings, initializing if needed."""
    path = os.path.join(PROJECT_DIR, 'elo-ratings.json')
    elo = load_json(path)
    if elo and len(elo) > 10:
        # Fill missing teams from initial
        for team, rating in INITIAL_ELO.items():
            if team not in elo:
                elo[team] = rating
        return elo
    return dict(INITIAL_ELO)


def load_processed():
    """Load set of already-processed match keys."""
    path = os.path.join(PROJECT_DIR, 'processed-matches.json')
    data = load_json(path)
    return set(data.get('processed', []) if data else [])


def save_processed(keys):
    save_json(os.path.join(PROJECT_DIR, 'processed-matches.json'),
              {'processed': list(keys), 'updatedAt': datetime.now(timezone.utc).isoformat()})


def load_results():
    """Load match results from all possible locations."""
    paths = [
        os.path.join(PROJECT_DIR, 'match-results.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'match-results.json'),
    ]
    for path in paths:
        data = load_json(path)
        if data:
            results = data.get('results', data) if isinstance(data, dict) else data
            if isinstance(results, list) and len(results) > 0:
                return results
    return []


def goal_diff_weight(gf, ga):
    """Bigger wins → bigger Elo change."""
    diff = abs(gf - ga)
    if diff <= 1: return 1.0
    if diff == 2: return 1.5
    return (11.0 + diff) / 8.0


def update_elo(elo, results, processed):
    """Update Elo ratings. Returns (new_elo, changes, new_processed)."""
    new_elo = dict(elo)
    changes = []
    new_processed = set(processed)

    for r in results:
        home = r.get('homeTeam', '')
        away = r.get('awayTeam', '')
        date = r.get('date', '')
        key = f"{home}|{away}|{date}"

        if key in processed:
            continue

        try:
            hg = int(r.get('homeScore', 0))
            ag = int(r.get('awayScore', 0))
        except (ValueError, TypeError):
            continue

        # Ensure teams exist
        for team in [home, away]:
            if team not in new_elo:
                new_elo[team] = INITIAL_ELO.get(team, 1800)

        h_elo = new_elo[home]
        a_elo = new_elo[away]

        # Expected: home gets advantage
        expected_home = 1.0 / (1.0 + math.pow(10, (a_elo - (h_elo + HOME_ADV)) / 400.0))

        # Actual outcome
        if hg > ag: actual_home = 1.0
        elif hg == ag: actual_home = 0.5
        else: actual_home = 0.0

        g = goal_diff_weight(hg, ag)
        delta = round(K_FACTOR * g * (actual_home - expected_home))
        new_elo[home] = h_elo + delta
        new_elo[away] = a_elo - delta
        new_processed.add(key)

        changes.append({
            'match': f'{home} {hg}-{ag} {away}',
            'date': date,
            'homeElo': f'{h_elo} → {new_elo[home]} ({delta:+d})',
            'awayElo': f'{a_elo} → {new_elo[away]} ({-delta:+d})',
            'weight': g,
        })

    return new_elo, changes, new_processed


def poisson_pmf(k, lam):
    if lam <= 0: lam = 0.05
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def compute_xg(home_elo, away_elo, h_form=1.0, a_form=1.0):
    B, HF, AS, DS = PARAMS['BASELINE'], PARAMS['HOME_FACTOR'], PARAMS['ATTACK_SPREAD'], PARAMS['DEFENSE_SPREAD']
    nh = (home_elo - 1900) / 300
    na = (away_elo - 1900) / 300
    ha = max(0.3, 1.0 + AS * nh)
    hd = max(0.3, 1.0 + DS * nh)
    aa = max(0.3, 1.0 + AS * na)
    ad = max(0.3, 1.0 + DS * na)
    xh = B * ha * (1.0 / ad) * HF * h_form
    xa = B * aa * (1.0 / hd) * a_form
    return max(0.1, min(7.0, xh)), max(0.1, min(7.0, xa))


def score_distribution(xg_h, xg_a):
    scores = []
    hw = dd = aw = tp = 0
    for h in range(0, 8):
        for a in range(0, 8):
            p = poisson_pmf(h, xg_h) * poisson_pmf(a, xg_a) * 100
            scores.append({'score': f'{h}-{a}', 'prob': round(p, 2)})
            tp += p
            if h > a: hw += p
            elif h == a: dd += p
            else: aw += p
    scores.sort(key=lambda x: -x['prob'])
    top = scores[:10]
    t = sum(s['prob'] for s in top)
    if t > 0:
        for s in top: s['prob'] = round(s['prob'] / t * 100, 1)
    if tp > 0:
        hw, dd, aw = round(hw/tp*100), round(dd/tp*100), round(aw/tp*100)
    return {'topScores': top, 'bestScore': top[0], 'homeWinPct': hw, 'drawPct': dd, 'awayWinPct': aw}


def regenerate_predictions(predictions, elo, results):
    """Regenerate all predictions with updated Elo ratings."""
    # Build completed match lookup
    completed = set()
    for r in results:
        completed.add(f"{r.get('homeTeam','')}|{r.get('awayTeam','')}")

    new_preds = []
    for p in predictions:
        home, away = p['homeTeam'], p['awayTeam']
        key = f"{home}|{away}"

        if key in completed:
            # Keep completed match as-is (don't re-predict the past)
            new_preds.append(p)
            continue

        h_elo = elo.get(home, INITIAL_ELO.get(home, 1900))
        a_elo = elo.get(away, INITIAL_ELO.get(away, 1900))

        xg_h, xg_a = compute_xg(h_elo, a_elo)
        elo_probs = score_distribution(xg_h, xg_a)

        # Blend with odds for outcome
        oh, od, oa = p.get('oddsHome', 2.0), p.get('oddsDraw', 3.5), p.get('oddsAway', 3.5)
        hp_odds, dp_odds, ap_odds = 1/oh, 1/od, 1/oa
        margin = (hp_odds + dp_odds + ap_odds - 1) / 3
        hc = max(0.02, hp_odds - margin)
        ac = max(0.02, ap_odds - margin)
        dc = max(0.02, dp_odds - margin)
        t = hc + dc + ac
        odds_hwp = round(hc / t * 100)
        odds_dp = round(dc / t * 100)
        odds_awp = round(ac / t * 100)

        w = 0.70
        new_preds.append({
            **p,
            'homeWinPct': round(odds_hwp * w + elo_probs['homeWinPct'] * (1-w)),
            'drawPct': round(odds_dp * w + elo_probs['drawPct'] * (1-w)),
            'awayWinPct': round(odds_awp * w + elo_probs['awayWinPct'] * (1-w)),
            'topScores': elo_probs['topScores'],
            'bestScore': elo_probs['bestScore'],
            'xgHome': round(xg_h, 2),
            'xgAway': round(xg_a, 2),
            'eloHome': h_elo,
            'eloAway': a_elo,
            'eloUpdated': True,
        })

    return new_preds


def main():
    apply_flag = '--apply' in sys.argv
    watch_flag = '--watch' in sys.argv

    # Load state
    elo = load_elo()
    processed = load_processed()
    results = load_results()
    if not results:
        print('No match results found', file=sys.stderr)
        return

    # Load predictions
    pred_paths = [
        os.path.join(PROJECT_DIR, 'worldcup-predictions.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'worldcup-predictions.json'),
    ]
    predictions = None
    for path in pred_paths:
        data = load_json(path)
        if isinstance(data, list) and len(data) > 0:
            predictions = data
            break

    if not predictions:
        print('No predictions found', file=sys.stderr)
        return

    # Update Elo
    new_elo, changes, new_processed = update_elo(elo, results, processed)

    if not changes:
        print('No new results to process')
        if not watch_flag:
            return

    # Show changes
    if changes:
        print(f'\n🔄 Elo 更新 ({len(changes)}场比赛)')
        for c in changes:
            print(f"  {c['date']} {c['match']}")
            print(f"    主: {c['homeElo']}  客: {c['awayElo']}  x{c['weight']}")

        # Show ranking changes
        old_sorted = sorted(elo.items(), key=lambda x: -x[1])[:8]
        new_sorted = sorted(new_elo.items(), key=lambda x: -x[1])[:8]
        print('\n🏆 Top 8 变动:')
        for i, (team, rating) in enumerate(new_sorted):
            old_rating = elo.get(team, rating)
            delta = rating - old_rating
            sign = '+' if delta > 0 else (' ' if delta == 0 else '')
            marker = '↑' if delta > 5 else ('↓' if delta < -5 else '→')
            print(f'  {i+1}. {team:<20s} {rating} ({sign}{delta}) {marker}')

    if apply_flag:
        # Regenerate predictions for remaining matches
        new_preds = regenerate_predictions(predictions, new_elo, results)

        # Write all outputs
        save_json(os.path.join(PROJECT_DIR, 'elo-ratings.json'), new_elo)
        save_json(os.path.join(PROJECT_DIR, 'worldcup-predictions.json'), new_preds)
        pub_path = os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'worldcup-predictions.json')
        os.makedirs(os.path.dirname(pub_path), exist_ok=True)
        save_json(pub_path, new_preds)
        save_processed(new_processed)

        # Stats
        completed = sum(1 for p in new_preds if f"{p['homeTeam']}|{p['awayTeam']}" in
                       {f"{r.get('homeTeam','')}|{r.get('awayTeam','')}" for r in results})
        remaining = len(new_preds) - completed
        print(f'\n✅ 已更新: {completed}场完赛, {remaining}场待预测')
        print(f'✅ elo-ratings.json')
        print(f'✅ worldcup-predictions.json')
        print(f'✅ processed-matches.json')
    else:
        print('\n(使用 --apply 应用变更)')


if __name__ == '__main__':
    main()
