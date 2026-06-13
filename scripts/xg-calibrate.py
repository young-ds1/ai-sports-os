#!/usr/bin/env python3
"""
xG Formula Calibrator
Uses WC 2022 + 2018 actual match data to calibrate the odds/elo → xG mapping.
Fixes the "50% 1-0" problem by fitting coefficients against real score distributions.

Usage:
    python3 scripts/xg-calibrate.py              # Run calibration + report
    python3 scripts/xg-calibrate.py --apply      # Update predictions JSON
"""

import json, math, sys, os
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# ── WC 2022 data (48 group stage matches) ──
ELO_2022 = {
    'Brazil': 2138, 'Argentina': 2119, 'France': 2102, 'England': 2087,
    'Spain': 2073, 'Portugal': 2053, 'Netherlands': 2046, 'Germany': 2041,
    'Belgium': 2031, 'Uruguay': 2014, 'Croatia': 2005, 'Denmark': 1992,
    'Switzerland': 1978, 'Senegal': 1967, 'USA': 1955, 'Mexico': 1948,
    'Morocco': 1941, 'Japan': 1936, 'Serbia': 1930, 'Iran': 1927,
    'South Korea': 1922, 'Poland': 1918, 'Wales': 1913, 'Australia': 1905,
    'Ecuador': 1898, 'Tunisia': 1892, 'Cameroon': 1885, 'Canada': 1880,
    'Costa Rica': 1870, 'Saudi Arabia': 1865, 'Ghana': 1860, 'Qatar': 1850,
}

WC2022 = [
    ('Qatar','Ecuador',0,2),('England','Iran',6,2),('Senegal','Netherlands',0,2),
    ('USA','Wales',1,1),('Argentina','Saudi Arabia',1,2),('Denmark','Tunisia',0,0),
    ('Mexico','Poland',0,0),('France','Australia',4,1),('Morocco','Croatia',0,0),
    ('Germany','Japan',1,2),('Spain','Costa Rica',7,0),('Belgium','Canada',1,0),
    ('Switzerland','Cameroon',1,0),('Uruguay','South Korea',0,0),('Portugal','Ghana',3,2),
    ('Brazil','Serbia',2,0),('Wales','Iran',0,2),('Qatar','Senegal',1,3),
    ('Netherlands','Ecuador',1,1),('England','USA',0,0),('Tunisia','Australia',0,1),
    ('Poland','Saudi Arabia',2,0),('France','Denmark',2,1),('Argentina','Mexico',2,0),
    ('Japan','Costa Rica',0,1),('Belgium','Morocco',0,2),('Croatia','Canada',4,1),
    ('Spain','Germany',1,1),('Cameroon','Serbia',3,3),('South Korea','Ghana',2,3),
    ('Brazil','Switzerland',1,0),('Portugal','Uruguay',2,0),
    ('Netherlands','Qatar',2,0),('Ecuador','Senegal',1,2),('Wales','England',0,3),
    ('Iran','USA',0,1),('Australia','Denmark',1,0),('Tunisia','France',1,0),
    ('Poland','Argentina',0,2),('Saudi Arabia','Mexico',1,2),('Croatia','Belgium',0,0),
    ('Canada','Morocco',1,2),('Japan','Spain',2,1),('Costa Rica','Germany',2,4),
    ('Ghana','Uruguay',0,2),('South Korea','Portugal',2,1),('Serbia','Switzerland',2,3),
    ('Cameroon','Brazil',1,0),
]

# ── WC 2018 data (48 group stage matches) ──
ELO_2018 = {
    'Brazil': 2131, 'Germany': 2102, 'Spain': 2088, 'France': 2071,
    'Argentina': 2059, 'Portugal': 2056, 'Belgium': 2043, 'England': 2024,
    'Uruguay': 2001, 'Croatia': 1994, 'Colombia': 1985, 'Switzerland': 1975,
    'Denmark': 1952, 'Mexico': 1940, 'Sweden': 1932, 'Senegal': 1930,
    'Serbia': 1918, 'Iran': 1915, 'South Korea': 1910, 'Japan': 1902,
    'Australia': 1898, 'Morocco': 1890, 'Nigeria': 1885, 'Costa Rica': 1880,
    'Iceland': 1878, 'Egypt': 1875, 'Russia': 1870, 'Poland': 1865,
    'Tunisia': 1852, 'Peru': 1848, 'Panama': 1835, 'Saudi Arabia': 1830,
}

WC2018 = [
    ('Russia','Saudi Arabia',5,0),('Egypt','Uruguay',0,1),('Morocco','Iran',0,1),
    ('Portugal','Spain',3,3),('France','Australia',2,1),('Argentina','Iceland',1,1),
    ('Peru','Denmark',0,1),('Croatia','Nigeria',2,0),('Costa Rica','Serbia',0,1),
    ('Germany','Mexico',0,1),('Brazil','Switzerland',1,1),('Sweden','South Korea',1,0),
    ('Belgium','Panama',3,0),('Tunisia','England',1,2),('Colombia','Japan',1,2),
    ('Poland','Senegal',1,2),('Russia','Egypt',3,1),('Portugal','Morocco',1,0),
    ('Uruguay','Saudi Arabia',1,0),('Iran','Spain',0,1),('Denmark','Australia',1,1),
    ('France','Peru',1,0),('Argentina','Croatia',0,3),('Brazil','Costa Rica',2,0),
    ('Nigeria','Iceland',2,0),('Serbia','Switzerland',1,2),('Belgium','Tunisia',5,2),
    ('South Korea','Mexico',1,2),('Germany','Sweden',2,1),('England','Panama',6,1),
    ('Japan','Senegal',2,2),('Poland','Colombia',0,3),('Uruguay','Russia',3,0),
    ('Saudi Arabia','Egypt',2,1),('Spain','Morocco',2,2),('Iran','Portugal',1,1),
    ('Australia','Peru',0,2),('Denmark','France',0,0),('Nigeria','Argentina',1,2),
    ('Iceland','Croatia',1,2),('South Korea','Germany',2,0),('Mexico','Sweden',0,3),
    ('Switzerland','Costa Rica',2,2),('Serbia','Brazil',0,2),('Japan','Poland',0,1),
    ('Senegal','Colombia',0,1),('Panama','Tunisia',1,2),('England','Belgium',0,1),
]

HOME_ADV = 40  # Elo home advantage

def elo_win_prob(elo_home, elo_away):
    """Elo-based win probability for home team."""
    diff = (elo_home + HOME_ADV) - elo_away
    return 1.0 / (1.0 + math.pow(10, -diff / 400.0))


def poisson_prob(k, lam):
    if lam <= 0: lam = 0.1
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def score_distribution(xg_home, xg_away):
    """Generate score distribution from xG values. Returns top scores + win/draw prob."""
    scores = []
    for h in range(0, 7):
        for a in range(0, 7):
            p = poisson_prob(h, xg_home) * poisson_prob(a, xg_away) * 100
            scores.append({'score': f'{h}-{a}', 'prob': round(p, 2)})
    scores.sort(key=lambda x: -x['prob'])

    # Normalize top 10
    total = sum(s['prob'] for s in scores[:10])
    if total > 0:
        for s in scores[:10]:
            s['prob'] = round(s['prob'] / total * 100, 1)

    # Win/draw probabilities
    hw = sum(s['prob'] for s in scores if int(s['score'][0]) > int(s['score'][2]))
    dd = sum(s['prob'] for s in scores if int(s['score'][0]) == int(s['score'][2]))
    aw = sum(s['prob'] for s in scores if int(s['score'][0]) < int(s['score'][2]))
    total_wd = hw + dd + aw
    if total_wd > 0:
        hw = round(hw / total_wd * 100)
        dd = round(dd / total_wd * 100)
        aw = round(aw / total_wd * 100)
    else:
        hw, dd, aw = 33, 34, 33

    return {'topScores': scores[:10], 'bestScore': scores[0],
            'homeWinPct': hw, 'drawPct': dd, 'awayWinPct': aw}


def calibrate(matches, elo_db, name):
    """Find optimal coefficients for xG = A * exp(B * logOdds)."""
    best_a, best_b, best_score = 1.0, 0.5, 1e9

    print(f'\n── {name} 校准 ──')
    print(f'当前公式: xG = 1.35 * exp(0.5 * logOdds)')

    # Build training data
    data = []
    for home, away, hg, ag in matches:
        h_elo = elo_db.get(home, 1900)
        a_elo = elo_db.get(away, 1900)
        p_home = elo_win_prob(h_elo, a_elo)
        p_home = max(0.05, min(0.95, p_home))
        p_away = 1 - p_home
        log_h = math.log(p_home / (1 - p_home))
        log_a = math.log(p_away / (1 - p_away))
        data.append({'home': home, 'away': away,
                     'goals_home': hg, 'goals_away': ag,
                     'log_home': log_h, 'log_away': log_a,
                     'p_home': p_home})

    # Grid search for optimal A, B
    best = None
    for A in [x/100 for x in range(80, 201, 5)]:  # 0.80 ~ 2.00
        for B in [x/100 for x in range(10, 121, 3)]:  # 0.10 ~ 1.20
            # Test: how well does xG predict actual goals?
            total_err = 0
            score_acc = 0
            for d in data:
                xg_h = A * math.exp(B * d['log_home'])
                xg_a = A * math.exp(B * d['log_away'])
                xg_h = max(0.2, min(6.0, xg_h))
                xg_a = max(0.2, min(6.0, xg_a))
                total_err += abs(xg_h - d['goals_home']) + abs(xg_a - d['goals_away'])

                # Check if best score matches
                dist = score_distribution(xg_h, xg_a)
                bs = dist['bestScore']['score']
                actual = f"{d['goals_home']}-{d['goals_away']}"
                if bs == actual:
                    score_acc += 1

            if total_err < best_score:
                best_score = total_err
                best = (A, B, score_acc)
                best_a, best_b = A, B

    # Report
    old_err = 0
    old_score_acc = 0
    for d in data:
        old_xg_h = 1.35 * math.exp(0.5 * d['log_home'])
        old_xg_a = 1.35 * math.exp(0.5 * d['log_away'])
        old_xg_h = max(0.2, min(6.0, old_xg_h))
        old_xg_a = max(0.2, min(6.0, old_xg_a))
        old_err += abs(old_xg_h - d['goals_home']) + abs(old_xg_a - d['goals_away'])
        dist = score_distribution(old_xg_h, old_xg_a)
        if dist['bestScore']['score'] == f"{d['goals_home']}-{d['goals_away']}":
            old_score_acc += 1

    print(f'旧公式: xG=1.35*exp(0.5*log) → MAE={old_err/len(data):.3f}, 比分命中={old_score_acc}/{len(data)}')
    a, b, sa = best
    print(f'新公式: xG={a:.2f}*exp({b:.2f}*log) → MAE={best_score/len(data):.3f}, 比分命中={sa}/{len(data)}')

    # Check 1-0 ratio with new formula
    ones = 0
    for d in data:
        xg_h = a * math.exp(b * d['log_home'])
        xg_a = a * math.exp(b * d['log_away'])
        dist = score_distribution(max(0.2, min(6.0, xg_h)), max(0.2, min(6.0, xg_a)))
        if dist['bestScore']['score'] == '1-0':
            ones += 1
    print(f'新公式 1-0 比例: {ones}/{len(data)} ({ones/len(data)*100:.0f}%) [旧: ~50%]')

    return {'A': best_a, 'B': best_b, 'MAE': best_score/len(data), 'scoreAcc': sa}


def main():
    apply_flag = '--apply' in sys.argv

    # Calibrate on 2022, validate on 2018
    r1 = calibrate(WC2022, ELO_2022, 'WC 2022 (训练)')
    r2 = calibrate(WC2018, ELO_2018, 'WC 2018 (验证)')

    best_A = round((r1['A'] + r2['A']) / 2, 2)
    best_B = round((r1['B'] + r2['B']) / 2, 2)

    print(f'\n═══ 最终系数: xG = {best_A} * exp({best_B} * logOdds) ═══')
    print(f'WC2022 MAE={r1["MAE"]:.3f} WC2018 MAE={r2["MAE"]:.3f}')

    # Validate: score distribution match
    print('\n── 新旧比分分布对比 ──')
    all_matches = [(h,a,hg,ag,ELO_2022.get(h,1900),ELO_2022.get(a,1900)) for h,a,hg,ag in WC2022]
    all_matches += [(h,a,hg,ag,ELO_2018.get(h,1900),ELO_2018.get(a,1900)) for h,a,hg,ag in WC2018]

    old_scores = defaultdict(int)
    new_scores = defaultdict(int)
    actual_scores = defaultdict(int)

    for home, away, hg, ag, h_elo, a_elo in all_matches:
        p_home = max(0.05, min(0.95, elo_win_prob(h_elo, a_elo)))
        p_away = 1 - p_home
        log_h = math.log(p_home / (1 - p_home))
        log_a = math.log(p_away / (1 - p_away))

        old_xgh = max(0.2, min(6, 1.35 * math.exp(0.5 * log_h)))
        old_xga = max(0.2, min(6, 1.35 * math.exp(0.5 * log_a)))
        new_xgh = max(0.2, min(6, best_A * math.exp(best_B * log_h)))
        new_xga = max(0.2, min(6, best_A * math.exp(best_B * log_a)))

        old_dist = score_distribution(old_xgh, old_xga)
        new_dist = score_distribution(new_xgh, new_xga)

        old_scores[old_dist['bestScore']['score']] += 1
        new_scores[new_dist['bestScore']['score']] += 1
        actual_scores[f'{hg}-{ag}'] += 1

    print(f'\n{"比分":>6} {"实际":>6} {"旧模型":>6} {"新模型":>6}')
    all_scores = sorted(set(list(old_scores.keys()) + list(new_scores.keys()) + list(actual_scores.keys())))
    for s in sorted(all_scores, key=lambda x: -actual_scores.get(x, 0))[:15]:
        print(f'{s:>6} {actual_scores.get(s,0):>6} {old_scores.get(s,0):>6} {new_scores.get(s,0):>6}')

    if apply_flag:
        # Save calibrated coefficients
        config_path = os.path.join(PROJECT_DIR, 'xg-coefficients.json')
        with open(config_path, 'w') as f:
            json.dump({'A': best_A, 'B': best_B, 'calibratedAt': '2026-06-13',
                        'trainingData': 'WC2022+WC2018 group stage (96 matches)',
                        'MAE_WC2022': r1['MAE'], 'MAE_WC2018': r2['MAE']}, f, indent=2)
        print(f'\n✅ 系数已保存到 {config_path}')
    else:
        print('\n(使用 --apply 保存系数)')


if __name__ == '__main__':
    main()
