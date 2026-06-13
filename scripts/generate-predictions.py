#!/usr/bin/env python3
"""
Generate final predictions using calibrated bivariate Poisson model.
- Outcome: 70% odds + 30% Elo model (best of both)
- Score distribution: Elo model with optimal parameters
- Outputs worldcup-predictions-v2.json
"""

import json, math, sys, os
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# Optimal parameters from calibration
PARAMS = {
    'BASELINE': 1.0,
    'HOME_FACTOR': 1.2,
    'ATTACK_SPREAD': 1.1,
    'DEFENSE_SPREAD': 0.5,
}

# Initial Elo ratings (2026 World Cup teams)
ELO_2026 = {
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


def poisson_pmf(k, lam):
    if lam <= 0: lam = 0.05
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def compute_xg(home_elo, away_elo, h_form=1.0, a_form=1.0):
    B, HF, AS, DS = PARAMS['BASELINE'], PARAMS['HOME_FACTOR'], PARAMS['ATTACK_SPREAD'], PARAMS['DEFENSE_SPREAD']
    norm_h = (home_elo - 1900) / 300
    norm_a = (away_elo - 1900) / 300
    h_att = max(0.3, 1.0 + AS * norm_h)
    h_def = max(0.3, 1.0 + DS * norm_h)
    a_att = max(0.3, 1.0 + AS * norm_a)
    a_def = max(0.3, 1.0 + DS * norm_a)
    xg_h = B * h_att * (1.0 / a_def) * HF * h_form
    xg_a = B * a_att * (1.0 / h_def) * a_form
    return max(0.1, min(7.0, xg_h)), max(0.1, min(7.0, xg_a))


def score_distribution(xg_h, xg_a):
    scores = []
    hw = dd = aw = total_p = 0
    for h in range(0, 8):
        for a in range(0, 8):
            p = poisson_pmf(h, xg_h) * poisson_pmf(a, xg_a) * 100
            scores.append({'score': f'{h}-{a}', 'prob': round(p, 2)})
            total_p += p
            if h > a: hw += p
            elif h == a: dd += p
            else: aw += p
    scores.sort(key=lambda x: -x['prob'])
    top = scores[:10]
    t = sum(s['prob'] for s in top)
    if t > 0:
        for s in top:
            s['prob'] = round(s['prob'] / t * 100, 1)
    if total_p > 0:
        hw, dd, aw = round(hw/total_p*100), round(dd/total_p*100), round(aw/total_p*100)
    else:
        hw, dd, aw = 33, 34, 33
    return {'topScores': top, 'bestScore': top[0], 'homeWinPct': hw, 'drawPct': dd, 'awayWinPct': aw}


def main():
    # Load current predictions
    pred_paths = [
        os.path.join(PROJECT_DIR, 'worldcup-predictions.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'worldcup-predictions.json'),
    ]
    predictions = None
    for path in pred_paths:
        try:
            with open(path) as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    predictions = data
                    break
        except Exception:
            continue

    if not predictions:
        import urllib.request
        try:
            req = urllib.request.Request('http://121.40.140.216:3000/worldcup-predictions.json',
                                         headers={'User-Agent': 'AISportsOS/1.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                predictions = json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            print(f'Cannot load predictions: {e}', file=sys.stderr)
            sys.exit(1)

    # Load recent form
    form = {}
    try:
        with open(os.path.join(PROJECT_DIR, 'recent-form.json')) as f:
            form = json.load(f)
    except Exception:
        pass

    new_predictions = []
    for p in predictions:
        home, away = p['homeTeam'], p['awayTeam']
        h_elo = ELO_2026.get(home, 1900)
        a_elo = ELO_2026.get(away, 1900)

        # Form adjustments
        h_form_adj = 1.0
        a_form_adj = 1.0
        for team, adj in [(home, 'h'), (away, 'a')]:
            if team in form:
                rf = form[team]
                n = max(len(rf.get('matches', [])), 1)
                avg_gf = rf.get('goalsScored', 0) / n
                adj_val = max(0.6, min(1.6, avg_gf / 1.5))
                if adj == 'h': h_form_adj = adj_val
                else: a_form_adj = adj_val

        # Elo model prediction
        xg_h, xg_a = compute_xg(h_elo, a_elo, h_form_adj, a_form_adj)
        elo_probs = score_distribution(xg_h, xg_a)

        # Odds-based prediction (for blending outcome)
        oh, od, oa = p.get('oddsHome', 2.0), p.get('oddsDraw', 3.5), p.get('oddsAway', 3.5)
        hp, dp, ap = 1/oh, 1/od, 1/oa
        margin = (hp + dp + ap - 1) / 3
        h_clean = max(0.02, hp - margin)
        a_clean = max(0.02, ap - margin)
        d_clean = max(0.02, dp - margin)
        total = h_clean + d_clean + a_clean
        odds_hwp = round(h_clean / total * 100)
        odds_dp = round(d_clean / total * 100)
        odds_awp = round(a_clean / total * 100)

        # Blend: 70% odds + 30% Elo for outcome
        w = 0.70
        final_hwp = round(odds_hwp * w + elo_probs['homeWinPct'] * (1-w))
        final_dp = round(odds_dp * w + elo_probs['drawPct'] * (1-w))
        final_awp = round(odds_awp * w + elo_probs['awayWinPct'] * (1-w))

        new_p = {
            **p,
            'homeWinPct': final_hwp,
            'drawPct': final_dp,
            'awayWinPct': final_awp,
            'topScores': elo_probs['topScores'],
            'bestScore': elo_probs['bestScore'],
            'xgHome': round(xg_h, 2),
            'xgAway': round(xg_a, 2),
            'eloHome': h_elo,
            'eloAway': a_elo,
            'source': 'odds + bivariate-poisson-elo-v2',
        }
        new_predictions.append(new_p)

    # Stats
    ones = sum(1 for p2 in new_predictions if p2['bestScore']['score'] == '1-0')
    scores = defaultdict(int)
    for p2 in new_predictions:
        scores[p2['bestScore']['score']] += 1

    print(f'── 最终预测 ({len(new_predictions)}场) ──')
    print(f'1-0 比例: {ones}/{len(new_predictions)} ({ones/len(new_predictions)*100:.0f}%)')
    print('比分分布:')
    for s, c in sorted(scores.items(), key=lambda x: -x[1])[:10]:
        print(f'  {s}: {c}场 ({c/len(new_predictions)*100:.0f}%)')

    # Show changed predictions for completed matches
    print(f'\n── 3场完赛对比 ──')
    completed_homes = ['South Korea', 'Canada', 'USA']
    for p2 in new_predictions:
        if p2['homeTeam'] in completed_homes:
            old_bs = p2.get('bestScore', {}).get('score', '?')
            print(f'{p2["homeTeam"]:12s} vs {p2["awayTeam"]:12s}  '
                  f'新: {p2["bestScore"]["score"]} (xG {p2["xgHome"]:.2f}-{p2["xgAway"]:.2f})  '
                  f'胜平负: {p2["homeWinPct"]}/{p2["drawPct"]}/{p2["awayWinPct"]}')

    # Write
    out_path = os.path.join(PROJECT_DIR, 'worldcup-predictions-v2.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(new_predictions, f, indent=2, ensure_ascii=False)

    pub_path = os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'worldcup-predictions-v2.json')
    os.makedirs(os.path.dirname(pub_path), exist_ok=True)
    with open(pub_path, 'w', encoding='utf-8') as f:
        json.dump(new_predictions, f, indent=2, ensure_ascii=False)

    print(f'\n✅ {out_path}')
    print(f'✅ {pub_path}')


if __name__ == '__main__':
    main()
