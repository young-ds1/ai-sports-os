#!/usr/bin/env python3
"""
Prediction Engine v3 — adds event system, fatigue, Dixon-Coles ρ correction.
Replaces generate-predictions.py. Produces worldcup-predictions.json.

New dimensions:
  1. Events: off-field factors → Elo adjustment (events.json)
  2. Fatigue: rest days between matches → performance decay
  3. Dixon-Coles ρ: low-score probability correction (0-0, 1-0, 0-1, 1-1)

Usage:
    python3 scripts/predict-v3.py                # Preview
    python3 scripts/predict-v3.py --apply        # Generate + write
"""

import json, math, sys, os
from datetime import datetime, timezone, timedelta
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# ── Model parameters (defaults, overridden by calibration) ──
BASELINE = 0.9
HOME_FACTOR = 1.2
ATTACK_SPREAD = 1.2
DEFENSE_SPREAD = 0.6
DC_RHO = -0.04
ODDS_WEIGHT = 0.70  # odds vs Elo blend
HOME_ADV_ELO = 40

# ── Fatigue parameters ──
# Performance decays when rest < 4 days, recovers at 5+ days
# Applied as multiplier to attack/defense
def fatigue_factor(rest_days):
    if rest_days is None or rest_days >= 5:
        return 1.0
    if rest_days >= 4:
        return 0.97
    if rest_days >= 3:
        return 0.93
    return 0.88  # 2 or fewer days rest

# Initial Elo
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
        with open(path) as f: return json.load(f)
    except Exception: return None


def load_events():
    """Load active off-field events with reliability weighting. Returns {team: total_severity}."""
    events = load_json(os.path.join(PROJECT_DIR, 'events.json'))
    if not events: return {}
    reliability_weights = events.get('reliabilityWeights', {'confirmed': 1.0, 'reliable_source': 0.8, 'rumor': 0.4, 'unverified': 0.2})
    active = {}
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    for e in events.get('events', []):
        if e.get('expiresAfter', '') < today:
            continue
        team = e.get('team', '')
        severity = e.get('severity', 0)
        reliability = e.get('reliability', 'rumor')
        weight = reliability_weights.get(reliability, 0.5)
        effective = int(severity * weight)
        active[team] = active.get(team, 0) + effective
        if effective != severity:
            cat = e.get('category', '?')
            print(f'  📰 {team} "{e.get("event","")}" [{cat}] {severity}×{weight}={effective:+d} Elo')
        else:
            cat = e.get('category', '?')
            print(f'  📰 {team} "{e.get("event","")}" [{cat}] {effective:+d} Elo')
    return active


def load_player_penalties():
    """Load key player absences AND superstar boosts. Returns {team: elo_adjustment}."""
    kp = load_json(os.path.join(PROJECT_DIR, 'key-players.json'))
    if not kp: return {}, {}
    penalties = {}
    boosts = {}
    for team, players in kp.get('players', {}).items():
        penalty = 0; boost = 0; has_superstar = False
        for p in players:
            status = p.get('status', 'available')
            weight = p.get('weight', 10)
            name = p.get('name', '')
            if status == 'out':
                if '首次' in name or 'Debut' in name or '新军' in name:
                    continue  # Skip debutant penalties for teams with superstars
                penalty += weight
            elif status == 'doubtful':
                if '首次' in name or 'Debut' in name or '新军' in name:
                    continue
                penalty += int(weight * 0.4)
            elif status == 'available' and weight >= 20:
                has_superstar = True
                if weight >= 28: boost += int(weight * 0.4)
                elif weight >= 22: boost += int(weight * 0.35)
                else: boost += int(weight * 0.3)
                # Superstar available: bonus scaled by tier
                if weight >= 28: boost += int(weight * 0.4)      # Ballon d'Or level
                elif weight >= 22: boost += int(weight * 0.35)   # World class
                else: boost += int(weight * 0.3)                  # Elite
        if penalty > 0:
            penalties[team] = -penalty
        if boost > 0:
            boosts[team] = boost
    return penalties, boosts


def load_squad_adjustments():
    """Load squad profiles. Returns {team: {experienceBonus, style}}."""
    sp = load_json(os.path.join(PROJECT_DIR, 'squad-profiles.json'))
    if not sp: return {}
    adj = {}
    exp_map = {5: 15, 4: 10, 3: 5, 2: 0, 1: -5}
    for team, profile in sp.get('teams', {}).items():
        exp_bonus = exp_map.get(profile.get('wcExperience', 2), 0)
        adj[team] = {
            'experienceBonus': exp_bonus,
            'style': profile.get('style', 'balanced'),
            'valueTier': profile.get('valueTier', 2),
            'avgAge': profile.get('avgAge', 27),
            'note': profile.get('note', ''),
        }
    return adj


def load_group_pressure():
    """Load group standings. Returns {team: pressureLevel}."""
    gs = load_json(os.path.join(PROJECT_DIR, 'group-standings.json'))
    if not gs: return {}
    pressure = {}
    standings = gs.get('currentStandings', {})
    for group_name, teams in standings.items():
        # Find teams that have played 0 matches → normal pressure
        # Teams that played 1 match → determine pressure from points
        for team, stats in teams.items():
            played = stats.get('played', 0)
            points = stats.get('points', 0)
            if played == 0:
                pressure[team] = 'normal'
            elif played >= 2:
                # Last group match → higher stakes
                pressure[team] = 'finalGroupMatch'
            else:
                # After 1 match: 3pts=comfortable, 1pt=needResult, 0pt=mustWin
                if points == 3:
                    pressure[team] = 'normal'
                elif points == 1:
                    pressure[team] = 'needResult'
                else:
                    pressure[team] = 'mustWin'
    return pressure


def tactic_matchup(home_style, away_style):
    """Compute tactical matchup multiplier for home team.
    Counter beats possession, physical disrupts technical."""
    if home_style == 'counter' and away_style == 'possession':
        return 1.08
    if home_style == 'physical' and away_style == 'possession':
        return 1.05
    if home_style == 'possession' and away_style == 'counter':
        return 0.92
    if home_style == 'possession' and away_style == 'physical':
        return 0.95
    return 1.0


def load_odds_signals():
    """Compute Elo adjustment from odds movement."""
    tracker = load_json(os.path.join(PROJECT_DIR, 'odds-tracker.json'))
    if not tracker: return {}
    signals = {}
    for key, data in tracker.get('trackedMatches', {}).items():
        init = data.get('initial', {}); latest = data.get('latest', {})
        if not init or not latest: continue
        oh_init = init.get('oddsHome', 2.0)
        oh_latest = latest.get('oddsHome', oh_init)
        if oh_init <= 1.1: continue
        move_pct = (oh_init - oh_latest) / oh_init * 100
        if move_pct > 20: signal = 25
        elif move_pct > 8: signal = 12
        elif move_pct > 3: signal = 5
        elif move_pct < -20: signal = -25
        elif move_pct < -8: signal = -12
        elif move_pct < -3: signal = -5
        else: signal = 0
        if signal != 0: signals[key] = signal
    return signals


def load_weather_effects():
    """Load weather effects. Returns {matchKey: {totalAdj, physicalBoost}}."""
    wf = load_json(os.path.join(PROJECT_DIR, 'weather-factors.json'))
    if not wf: return {}
    effects = {}
    for key, cond in wf.get('matches', {}).items():
        adj = {'total': 0.0, 'physical': False}
        t = cond.get('temperature', 22)
        if t >= 35: adj['total'] -= 0.3
        elif t >= 25: adj['total'] += 0.0
        elif t >= 15: adj['total'] += 0.1
        elif t >= 5: adj['total'] -= 0.1
        else: adj['total'] -= 0.3
        rain = cond.get('rain', 'none')
        if rain == 'heavy': adj['total'] -= 0.5; adj['physical'] = True
        elif rain == 'moderate': adj['total'] -= 0.1; adj['physical'] = True
        elif rain == 'light': adj['total'] += 0.1
        wind = cond.get('wind', 'calm')
        if wind == 'strong': adj['total'] -= 0.3
        elif wind == 'moderate': adj['total'] -= 0.1
        effects[key] = adj
    return effects


def load_historical_similar(home_elo, away_elo, num_similar=20):
    """Find historically similar matches from WC database."""
    db_path = os.path.join(PROJECT_DIR, 'historical-db.json')
    db = load_json(db_path)
    if not db: return None
    elo_diff = (home_elo + HOME_ADV_ELO) - away_elo
    # Find closest Elo differentials
    matches = db.get('matches', [])
    scored = []
    for m in matches:
        m_diff = m.get('eloDiff', 0)
        scored.append((abs(m_diff - elo_diff), m))
    scored.sort(key=lambda x: x[0])
    similar = [s[1] for s in scored[:num_similar]]
    # Aggregate
    outcomes = {'home': 0, 'draw': 0, 'away': 0}
    scores = {}
    for m in similar:
        hg, ag = m['homeGoals'], m['awayGoals']
        scores[f'{hg}-{ag}'] = scores.get(f'{hg}-{ag}', 0) + 1
        if hg > ag: outcomes['home'] += 1
        elif hg == ag: outcomes['draw'] += 1
        else: outcomes['away'] += 1
    n = len(similar)
    return {
        'matchCount': n,
        'avgEloDiff': sum(m['eloDiff'] for m in similar) / n,
        'outcomes': {k: round(v/n*100) for k, v in outcomes.items()},
        'topScores': sorted(scores.items(), key=lambda x: -x[1])[:5],
        'avgHomeGoals': sum(m['homeGoals'] for m in similar) / n,
        'avgAwayGoals': sum(m['awayGoals'] for m in similar) / n,
    }


def load_schedule(predictions):
    """Build {team: [match_dates]} to compute rest days."""
    sched = defaultdict(list)
    for p in predictions:
        date = p.get('date', '')
        sched[p['homeTeam']].append(date)
        sched[p['awayTeam']].append(date)
    # Sort dates for each team
    for team in sched:
        sched[team] = sorted(set(sched[team]))
    return sched


def rest_days(team, match_date, schedule):
    """Calculate rest days before this match for this team."""
    dates = schedule.get(team, [])
    if not dates: return None
    try:
        md = datetime.strptime(match_date, '%Y-%m-%d')
    except Exception:
        return None
    prev = None
    for d in dates:
        try:
            dd = datetime.strptime(d, '%Y-%m-%d')
            if dd < md:
                prev = dd
        except Exception:
            continue
    if prev is None:
        return None  # First match, no fatigue reference
    return (md - prev).days


def poisson_pmf(k, lam):
    if lam <= 0: lam = 0.05
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def dc_correction(h, a, lam_h, lam_a, rho=DC_RHO):
    """Dixon-Coles correction factor τ(x,y) for low scores."""
    if h == 0 and a == 0:
        return 1 - lam_h * lam_a * rho
    elif h == 1 and a == 0:
        return 1 + lam_h * rho
    elif h == 0 and a == 1:
        return 1 + lam_a * rho
    elif h == 1 and a == 1:
        return 1 - rho
    return 1.0


def compute_xg(home_elo, away_elo, h_fatigue=1.0, a_fatigue=1.0, h_event=0, a_event=0):
    """Compute xG with all adjustments. Event severity applied as temporary Elo shift."""
    # Apply event adjustment to effective Elo
    h_eff = home_elo + h_event
    a_eff = away_elo + a_event

    nh = (h_eff - 1900) / 300
    na = (a_eff - 1900) / 300
    ha = max(0.3, 1.0 + ATTACK_SPREAD * nh)
    hd = max(0.3, 1.0 + DEFENSE_SPREAD * nh)
    aa = max(0.3, 1.0 + ATTACK_SPREAD * na)
    ad = max(0.3, 1.0 + DEFENSE_SPREAD * na)

    xh = BASELINE * ha * (1.0 / ad) * HOME_FACTOR * h_fatigue
    xa = BASELINE * aa * (1.0 / hd) * a_fatigue
    return max(0.1, min(7.0, xh)), max(0.1, min(7.0, xa))


def xg_from_elo_gap(home_elo, away_elo, fatigue_h=1.0, fatigue_a=1.0):
    """Extreme Elo gap lookup. Poisson fails at gap>200, use empirical table."""
    gap = (home_elo + HOME_ADV_ELO) - away_elo
    if gap > 300:    xh, xa = 3.8, 0.3
    elif gap > 250:  xh, xa = 3.2, 0.4
    elif gap > 200:  xh, xa = 2.6, 0.5
    elif gap > 150:  xh, xa = 2.0, 0.6
    elif gap < -300: xh, xa = 0.3, 3.8
    elif gap < -250: xh, xa = 0.4, 3.2
    elif gap < -200: xh, xa = 0.5, 2.6
    elif gap < -150: xh, xa = 0.6, 2.0
    else: return None
    return xh * fatigue_h, xa * fatigue_a


def score_distribution_dc(xg_h, xg_a):
    """Score distribution with Dixon-Coles ρ correction."""
    scores = []
    hw = dd = aw = tp = 0
    for h in range(0, 8):
        for a in range(0, 8):
            p_raw = poisson_pmf(h, xg_h) * poisson_pmf(a, xg_a)
            tau = dc_correction(h, a, xg_h, xg_a, DC_RHO)
            p = max(0, p_raw * tau) * 100
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
    else:
        hw, dd, aw = 33, 34, 33
    return {'topScores': top, 'bestScore': top[0], 'homeWinPct': hw, 'drawPct': dd, 'awayWinPct': aw}


def load_team_form_adjustments():
    """Load match stats and compute form-based xG adjustments per team."""
    mr = load_json(os.path.join(PROJECT_DIR, 'match-results.json'))
    if not mr: return {}
    results = mr.get('results', [])
    if not results: return {}

    form = {}
    for r in results:
        if 'homeStats' not in r: continue
        h, a = r['homeTeam'], r['awayTeam']
        hg, ag = r['homeScore'], r['awayScore']
        hs, aw = r['homeStats'], r['awayStats']
        for team, gf, ga, shots_str, sot_str, shots_faced_str in [
            (h, hg, ag, hs.get('totalShots','0'), hs.get('shotsOnTarget','0'), aw.get('totalShots','0')),
            (a, ag, hg, aw.get('totalShots','0'), aw.get('shotsOnTarget','0'), hs.get('totalShots','0'))]:
            try:
                shots = int(shots_str); sot = int(sot_str); shots_faced = int(shots_faced_str)
            except (ValueError, TypeError):
                continue
            if team not in form:
                form[team] = {'gp':0, 'goals':0, 'conceded':0, 'shots':0, 'sot':0, 'shots_faced':0}
            f = form[team]
            f['gp'] += 1; f['goals'] += gf; f['conceded'] += ga
            f['shots'] += shots; f['sot'] += sot; f['shots_faced'] += shots_faced

    # Convert to adjustment multipliers (1.0 = no change)
    # Blend: 40% actual goals, 30% shot conversion, 15% shot accuracy, 15% defense
    adj = {}
    INITIAL_ELO_LOCAL = INITIAL_ELO
    for team, f in form.items():
        if f['gp'] == 0: continue
        gp = f['gp']

        # 1. Goals vs expected (20% - small sample, don't overfit)
        actual_gpg = f['goals'] / gp
        elo = INITIAL_ELO_LOCAL.get(team, 1900)
        expected_gpg = elo / 1200
        goal_mult = 1.0 + (actual_gpg - expected_gpg) / max(expected_gpg, 0.5) * 0.20

        # 2. Shot conversion rate (40% - KEY efficiency metric for upset detection)
        avg_conversion = 0.10
        team_conversion = f['goals'] / max(f['shots'], 1)
        conversion_mult = 1.0 + (team_conversion - avg_conversion) * 2.5 * 0.40

        # 3. Shot accuracy SoT/shots (20% - attack quality)
        avg_accuracy = 0.35
        team_accuracy = f['sot'] / max(f['shots'], 1)
        accuracy_mult = 1.0 + (team_accuracy - avg_accuracy) * 1.0 * 0.20

        # 4. Defensive solidity (20% - goals conceded per shots faced)
        avg_concede_rate = 0.12
        team_concede_rate = f['conceded'] / max(f['shots_faced'], 1)
        defense_mult = 1.0 - (team_concede_rate - avg_concede_rate) * 2.5 * 0.20

        blend = goal_mult + conversion_mult + accuracy_mult + defense_mult - 3.0
        capped = max(0.80, min(1.20, blend))
        adj[team] = round(capped, 3)

    return adj


def main():
    global BASELINE, HOME_FACTOR, ATTACK_SPREAD, DEFENSE_SPREAD, DC_RHO
    # Load calibrated parameters
    coeffs = load_json(os.path.join(PROJECT_DIR, 'xg-coefficients.json'))
    if coeffs:
        BASELINE = coeffs.get('BASELINE', BASELINE)
        HOME_FACTOR = coeffs.get('HOME_FACTOR', HOME_FACTOR)
        ATTACK_SPREAD = coeffs.get('ATTACK_SPREAD', ATTACK_SPREAD)
        DEFENSE_SPREAD = coeffs.get('DEFENSE_SPREAD', DEFENSE_SPREAD)
        DC_RHO = coeffs.get('DC_RHO', DC_RHO)

    apply_flag = '--apply' in sys.argv

    # Load data
    pred_paths = [
        os.path.join(PROJECT_DIR, 'worldcup-predictions.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'worldcup-predictions.json'),
    ]
    predictions = None
    for path in pred_paths:
        data = load_json(path)
        if isinstance(data, list) and len(data) > 0:
            predictions = data; break
    if not predictions:
        print('No predictions found'); return

    # Load Elo ratings
    elo_path = os.path.join(PROJECT_DIR, 'elo-ratings.json')
    elo = load_json(elo_path) or dict(INITIAL_ELO)
    for team in INITIAL_ELO:
        if team not in elo: elo[team] = INITIAL_ELO[team]

    # Load events
    events = load_events()
    # Merge player penalties into events
    player_penalties, player_boosts = load_player_penalties()
    for team, penalty in player_penalties.items():
        events[team] = events.get(team, 0) + penalty
    for team, boost in player_boosts.items():
        events[team] = events.get(team, 0) + boost

    if events:
        print(f'📰 场外+球员因素: {len(events)}队受影响')
        for team, sev in events.items():
            print(f'   {team}: {sev:+d} Elo点')

    # Load completed results (don't re-predict)
    results_paths = [
        os.path.join(PROJECT_DIR, 'match-results.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'match-results.json'),
    ]
    completed = set()
    for path in results_paths:
        data = load_json(path)
        if data:
            results = data.get('results', data) if isinstance(data, dict) else data
            if isinstance(results, list):
                for r in results:
                    completed.add(f"{r.get('homeTeam','')}|{r.get('awayTeam','')}")

    # Load squad profiles + group pressure + tactical + odds signals + weather
    squad_adj = load_squad_adjustments()
    pressure = load_group_pressure()
    pressure_config = load_json(os.path.join(PROJECT_DIR, 'group-standings.json'))
    pressure_levels = (pressure_config or {}).get('progressionPressure', {})
    odds_signals = load_odds_signals()
    weather_effects = load_weather_effects()
    team_form_adj = load_team_form_adjustments()

    # Build schedule for rest days
    schedule = load_schedule(predictions)

    # Generate
    new_preds = []
    for p in predictions:
        home, away = p['homeTeam'], p['awayTeam']
        key = f"{home}|{away}"

        if key in completed:
            oh2, od2, oa2 = p.get('oddsHome',2), p.get('oddsDraw',3.5), p.get('oddsAway',3.5)
            if oh2 > 1.01:
                hp2, dp2, ap2 = 1/oh2, 1/od2, 1/oa2
                mg2 = (hp2+dp2+ap2-1)/3
                hc2, dc2, ac2 = max(.02,hp2-mg2), max(.02,dp2-mg2), max(.02,ap2-mg2)
                t2 = hc2+dc2+ac2
                p['homeWinPct'] = round(hc2/t2*100)
                p['drawPct'] = round(dc2/t2*100)
                p['awayWinPct'] = round(ac2/t2*100)
            new_preds.append(p)
            continue

        # Get Elo
        h_elo = elo.get(home, INITIAL_ELO.get(home, 1900))
        a_elo = elo.get(away, INITIAL_ELO.get(away, 1900))

        # Event adjustment
        h_event = events.get(home, 0)
        a_event = events.get(away, 0)

        # Squad experience bonus
        h_exp = squad_adj.get(home, {}).get('experienceBonus', 0)
        a_exp = squad_adj.get(away, {}).get('experienceBonus', 0)
        h_event += h_exp
        a_event += a_exp

        # Rest days fatigue
        date = p.get('date', '')
        h_rest = rest_days(home, date, schedule)
        a_rest = rest_days(away, date, schedule)
        h_fatigue = fatigue_factor(h_rest)
        a_fatigue = fatigue_factor(a_rest)

        # Group pressure (motivation multiplier)
        h_pressure = pressure.get(home, 'normal')
        a_pressure = pressure.get(away, 'normal')
        press_config = pressure_levels.get(h_pressure, {})
        h_press_att = press_config.get('attackMultiplier', 1.0)
        h_press_def = press_config.get('defenseMultiplier', 1.0)
        press_config_a = pressure_levels.get(a_pressure, {})
        a_press_att = press_config_a.get('attackMultiplier', 1.0)
        a_press_def = press_config_a.get('defenseMultiplier', 1.0)

        # Superstar boost scaled by opponent defense: Haaland vs weak defense = higher
        h_super_boost = player_boosts.get(home, 0)
        a_super_boost = player_boosts.get(away, 0)
        if h_super_boost:
            h_super_boost = round(h_super_boost * (1 + (1900 - a_elo) / 400))
            h_event += h_super_boost
            # Superstar overrides negative experience (debutant/inexperienced teams)
            if h_exp < 0:
                h_event += abs(h_exp)  # Cancel negative experience
        if a_super_boost:
            a_super_boost = round(a_super_boost * (1 + (1900 - h_elo) / 400))
            a_event += a_super_boost
            if a_exp < 0:
                a_event += abs(a_exp)

        # Tactical matchup
        h_style = squad_adj.get(home, {}).get('style', 'balanced')
        a_style = squad_adj.get(away, {}).get('style', 'balanced')
        tactic_mult = tactic_matchup(h_style, a_style)

        # Odds movement signal
        odds_key = f"{home}|{away}"
        odds_signal = odds_signals.get(odds_key, 0)
        h_event += odds_signal  # Apply odds signal to home Elo (positive = good for home)

        # Weather adjustment
        weather = weather_effects.get(odds_key, {})
        weather_total_adj = weather.get('total', 0.0)
        weather_physical = weather.get('physical', False)

        # Compute xG with ALL factors
        # Try extreme Elo gap lookup first, fall back to compute_xg
        xg_extreme = xg_from_elo_gap(h_elo, a_elo, h_fatigue, a_fatigue)
        if xg_extreme:
            xg_h, xg_a = xg_extreme
        else:
            xg_h, xg_a = compute_xg(h_elo, a_elo, h_fatigue, a_fatigue, h_event, a_event)
        # Apply pressure + tactical multipliers
        xg_h = xg_h * h_press_att / a_press_def * tactic_mult
        xg_a = xg_a * a_press_att / h_press_def / tactic_mult
        # Apply weather: adjust total goals (split evenly)
        if weather_total_adj != 0:
            xg_h += weather_total_adj / 2
            xg_a += weather_total_adj / 2
        # Physical boost in rain: physical teams get +8%
        if weather_physical:
            if h_style == 'physical': xg_h *= 1.08
            if a_style == 'physical': xg_a *= 1.08
        xg_h = max(0.1, min(7.0, xg_h))
        xg_a = max(0.1, min(7.0, xg_a))

        # Team form: efficiency-based adjustment from actual match stats
        # Low efficiency teams (high shots, low goals) get penalized
        # High efficiency teams (low shots, high goals) get boosted
        h_form_adj = team_form_adj.get(home, 1.0)
        a_form_adj = team_form_adj.get(away, 1.0)
        xg_h *= h_form_adj
        xg_a *= a_form_adj
        xg_h = max(0.1, min(7.0, xg_h))
        xg_a = max(0.1, min(7.0, xg_a))

        # ── Upset Analysis: specific conditions that make an upset likely ──
        upset_reasons = []
        elo_gap2 = (h_elo + HOME_ADV_ELO) - a_elo
        favorite = home if elo_gap2 > 0 else away
        underdog = away if elo_gap2 > 0 else home
        fav_elo = max(h_elo, a_elo); und_elo = min(h_elo, a_elo)

        # Condition 1: Extreme Elo gap (>200) — mismatch = volatile
        if abs(elo_gap2) > 200:
            upset_reasons.append(f'Elo差{abs(elo_gap2):.0f}分-强弱悬殊但足球非数学')

        # Condition 2: Favorite injury/event crisis
        fav_events = h_event if favorite == home else a_event
        if fav_events < -12:
            upset_reasons.append(f'{cn(favorite)}受负面事件影响({fav_events}Elo点)')

        # Condition 3: Underdog efficiency — clinical finishing
        und_form = team_form_adj.get(underdog, 1.0)
        if und_form > 1.05:
            upset_reasons.append(f'{cn(underdog)}射门转化率异常高-临床级终结')

        # Condition 4: Debutant unpredictability
        if underdog in ['Cape Verde','Curaçao','Jordan','Uzbekistan'] or favorite in ['Cape Verde','Curaçao','Jordan','Uzbekistan']:
            upset_reasons.append('新军参赛-历史数据缺乏-变数极大')

        # Condition 5: Favorite wasteful (high shots, low goals from form data)
        fav_form = team_form_adj.get(favorite, 1.0)
        if fav_form < 0.90:
            upset_reasons.append(f'{cn(favorite)}攻击低效-射门多进球少')

        # Condition 6: Low possession but winning — counter-attack threat
        und_pressure = pressure.get(underdog, 'normal')
        if und_pressure in ('mustWin', 'needResult'):
            upset_reasons.append(f'{cn(underdog)}背水一战-出线压力激发')

        upset_risk = 'high' if len(upset_reasons) >= 3 else ('medium' if len(upset_reasons) >= 2 else ('low' if len(upset_reasons) >= 1 else 'none'))

        # Historical similarity
        hist = load_historical_similar(h_elo, a_elo)
        elo_probs = score_distribution_dc(xg_h, xg_a)

        # Blend with odds
        oh, od, oa = p.get('oddsHome', 2.0), p.get('oddsDraw', 3.5), p.get('oddsAway', 3.5)
        hp, dp, ap = 1/oh, 1/od, 1/oa
        margin = (hp+dp+ap-1)/3
        hc, dc, ac = max(0.02, hp-margin), max(0.02, dp-margin), max(0.02, ap-margin)
        t = hc+dc+ac
        odds_hwp = round(hc/t*100); odds_dp = round(dc/t*100); odds_awp = round(ac/t*100)

        w = ODDS_WEIGHT
        new_preds.append({
            **p,
            'homeWinPct': round(odds_hwp*w + elo_probs['homeWinPct']*(1-w)),
            'drawPct': round(odds_dp*w + elo_probs['drawPct']*(1-w)),
            'awayWinPct': round(odds_awp*w + elo_probs['awayWinPct']*(1-w)),
            'topScores': elo_probs['topScores'],
            'bestScore': elo_probs['bestScore'],
            'xgHome': round(xg_h, 2),
            'xgAway': round(xg_a, 2),
            'upsetIndex': round(abs((h_elo + HOME_ADV_ELO) - a_elo)/400*0.4 + (0.15 if home in ['Cape Verde','Curaçao','Jordan','Uzbekistan'] or away in ['Cape Verde','Curaçao','Jordan','Uzbekistan'] else 0) + (0.1 if (h_event< -10 or a_event< -10) else 0), 2),
            'eloHome': h_elo, 'eloAway': a_elo,
            'eventHome': h_event, 'eventAway': a_event,
            'restHome': h_rest, 'restAway': a_rest,
            'fatigueHome': round(h_fatigue, 3), 'fatigueAway': round(a_fatigue, 3),
            'pressureHome': h_pressure, 'pressureAway': a_pressure,
            'styleHome': h_style, 'styleAway': a_style,
            'tacticMult': round(tactic_mult, 3),
            'experienceHome': h_exp, 'experienceAway': a_exp,
            'oddsSignal': odds_signal,
            'weatherTotalAdj': round(weather_total_adj, 2),
            'weatherPhysical': weather_physical,
            'historicalSimilar': hist,
            'upsetReasons': upset_reasons,
            'upsetRisk': upset_risk,
            'source': 'odds + elo + events + fatigue + squad + pressure + tactic + weather + historical + dc-rho',
        })

    # Stats
    from collections import Counter
    scores = Counter(p.get('bestScore',{}).get('score','?') for p in new_preds)
    ones = scores.get('1-0', 0)
    print(f'\n── v3预测 ({len(new_preds)}场) ──')
    print(f'1-0: {ones}/{len(new_preds)} ({ones/len(new_preds)*100:.0f}%)')
    print(f'比分分布: {scores.most_common(10)}')

    # Show events impact
    if events:
        print('\n── 事件影响 ──')
        for p in new_preds:
            if p.get('eventHome') or p.get('eventAway'):
                eh, ea = p.get('eventHome', 0), p.get('eventAway', 0)
                if eh or ea:
                    signs = []
                    if eh: signs.append(f"{p['homeTeam']} {eh:+d}")
                    if ea: signs.append(f"{p['awayTeam']} {ea:+d}")
                    print(f"  {p['homeTeam']} vs {p['awayTeam']}: {', '.join(signs)}  "
                          f"xG={p['xgHome']}-{p['xgAway']}  {p.get('bestScore',{}).get('score','?')}")

    # Show fatigue impact
    fatigued = [p for p in new_preds if p.get('fatigueHome', 1.0) < 0.95 or p.get('fatigueAway', 1.0) < 0.95]
    if fatigued:
        print(f'\n── 疲劳影响 ({len(fatigued)}场) ──')
        for p in fatigued[:5]:
            print(f"  {p['homeTeam']} vs {p['awayTeam']}: rest={p.get('restHome','?')}/{p.get('restAway','?')}d  "
                  f"fatigue={p['fatigueHome']:.2f}/{p['fatigueAway']:.2f}  xG={p['xgHome']}-{p['xgAway']}")

    # Show pressure impact
    pressured = [p for p in new_preds if p.get('pressureHome') not in (None, 'normal') or p.get('pressureAway') not in (None, 'normal')]
    if pressured:
        print(f'\n── 出线压力 ({len(pressured)}场) ──')
        for p in pressured[:5]:
            print(f"  {p['homeTeam']}({p.get('pressureHome','?'):12s}) vs {p['awayTeam']}({p.get('pressureAway','?'):12s})  xG={p['xgHome']}-{p['xgAway']}")

    # Show tactical matchups
    tactical = [p for p in new_preds if p.get('tacticMult', 1.0) != 1.0]
    if tactical:
        print(f'\n── 战术克制 ({len(tactical)}场) ──')
        for p in tactical[:5]:
            print(f"  {p['homeTeam']}({p.get('styleHome','?')}) vs {p['awayTeam']}({p.get('styleAway','?')})  "
                  f"tacticMult={p['tacticMult']}")

    # Show odds signals
    signaled = [p for p in new_preds if p.get('oddsSignal', 0) != 0]
    if signaled:
        print(f'\n── 赔率信号 ({len(signaled)}场) ──')
        for p in signaled[:5]:
            print(f"  {p['homeTeam']} vs {p['awayTeam']}: signal={p['oddsSignal']:+d}")

    # Show weather effects
    weathered = [p for p in new_preds if p.get('weatherTotalAdj', 0) != 0]
    if weathered:
        print(f'\n── 天气影响 ({len(weathered)}场) ──')
        for p in weathered[:5]:
            pb = '物理队优势' if p.get('weatherPhysical') else ''
            print(f"  {p['homeTeam']} vs {p['awayTeam']}: goalsAdj={p['weatherTotalAdj']:+.1f} {pb}")

    # Show historical comparison for a sample match
    hist_sample = [p for p in new_preds if p.get('historicalSimilar')][:1]
    if hist_sample:
        print(f'\n── 历史相似对阵示例 ──')
        for p in hist_sample:
            h = p['historicalSimilar']
            if h:
                tops = ', '.join(f'{s}({c})' for s, c in h['topScores'][:3])
                print(f"  {p['homeTeam']} vs {p['awayTeam']} (Elo差≈{h['avgEloDiff']:.0f}):")
                print(f"  模型预测: {p.get('bestScore',{}).get('score','?')}")
                print(f"  历史({h['matchCount']}场相似): 胜{h['outcomes']['home']}%/平{h['outcomes']['draw']}%/客{h['outcomes']['away']}%  {tops}")

    if apply_flag:
        out = os.path.join(PROJECT_DIR, 'worldcup-predictions.json')
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(new_preds, f, indent=2, ensure_ascii=False)
        pub = os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'worldcup-predictions.json')
        os.makedirs(os.path.dirname(pub), exist_ok=True)
        with open(pub, 'w', encoding='utf-8') as f:
            json.dump(new_preds, f, indent=2, ensure_ascii=False)
        print(f'\n✅ {out}')
        print(f'✅ {pub}')
    else:
        print('\n(使用 --apply 写入)')


if __name__ == '__main__':
    main()
