#!/usr/bin/env python3
"""
World Cup 2026 Prediction Calibrator
Updates Elo ratings based on actual match results and recalibrates
remaining predictions. Uses Elo + goal difference model.

Elo formula:
    expected = 1 / (1 + 10^(-eloDiff/400))
    new_elo = old_elo + K * G * (actual - expected)
    where K = 32 (group stage), G = goal difference weight

Usage:
    python3 scripts/calibrate-model.py                    # preview calibration
    python3 scripts/calibrate-model.py --apply            # write updated predictions
    python3 scripts/calibrate-model.py --json             # output calibrated predictions as JSON
"""

import json
import math
import sys
import os
from datetime import datetime, timezone
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

K_FACTOR = 32  # Elo K-factor for group stage

# Initial Elo ratings based on FIFA ranking + betting market implied strength
INITIAL_ELO = {
    "Argentina": 2138, "France": 2112, "Brazil": 2098, "England": 2085,
    "Spain": 2070, "Germany": 2055, "Portugal": 2040, "Netherlands": 2025,
    "Belgium": 2005, "Uruguay": 1990, "Croatia": 1980, "Colombia": 1970,
    "Morocco": 1960, "Senegal": 1950, "Japan": 1945, "Iran": 1940,
    "USA": 1935, "Mexico": 1930, "Austria": 1925, "Sweden": 1920,
    "Turkey": 1915, "Ecuador": 1910, "Egypt": 1905, "South Korea": 1900,
    "Australia": 1895, "Canada": 1890, "Ivory Coast": 1885, "Serbia": 1880,
    "Saudi Arabia": 1875, "Qatar": 1870, "Tunisia": 1865, "Scotland": 1860,
    "Paraguay": 1855, "Norway": 1850, "Algeria": 1845, "Ghana": 1840,
    "Iraq": 1835, "Panama": 1830, "South Africa": 1825, "Czech Republic": 1820,
    "Cape Verde": 1815, "Curaçao": 1810, "Haiti": 1805, "New Zealand": 1800,
    "Jordan": 1795, "Costa Rica": 1790, "Uzbekistan": 1785, "DR Congo": 1780,
    "Bosnia & Herzegovina": 1845,
}

# Venue/home advantage: ~40 Elo points
HOME_ADVANTAGE = 40


def load_json(path_or_url):
    if path_or_url.startswith("http"):
        import urllib.request
        req = urllib.request.Request(path_or_url, headers={"User-Agent": "AISportsOS/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    with open(path_or_url, "r", encoding="utf-8") as f:
        return json.load(f)


def elo_expected(rating_a, rating_b):
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))


def goal_diff_weight(goals_for, goals_against):
    """Weight multiplier based on goal difference. Big wins → bigger Elo change."""
    diff = abs(goals_for - goals_against)
    if diff <= 1:
        return 1.0
    elif diff == 2:
        return 1.5
    else:
        return (11.0 + diff) / 8.0  # ~1.75 for 3-goal diff


def update_elo_from_results(elo_ratings, results):
    """Update Elo ratings based on actual match results."""
    updated = dict(elo_ratings)
    changes = []

    for r in results:
        home = r.get("homeTeam", "")
        away = r.get("awayTeam", "")
        home_score = int(r.get("homeScore", 0))
        away_score = int(r.get("awayScore", 0))
        date = r.get("date", "")

        if home not in updated:
            updated[home] = INITIAL_ELO.get(home, 1800)
        if away not in updated:
            updated[away] = INITIAL_ELO.get(away, 1800)

        home_elo = updated[home]
        away_elo = updated[away]

        # Home team gets advantage in rating
        home_rating = home_elo + HOME_ADVANTAGE
        away_rating = away_elo

        # Actual result
        if home_score > away_score:
            home_actual, away_actual = 1.0, 0.0
        elif home_score == away_score:
            home_actual, away_actual = 0.5, 0.5
        else:
            home_actual, away_actual = 0.0, 1.0

        # Expected result
        home_expected = elo_expected(home_rating, away_rating)
        away_expected = 1.0 - home_expected

        # Goal difference weight
        g = goal_diff_weight(home_score, away_score)

        # Update
        new_home = round(home_elo + K_FACTOR * g * (home_actual - home_expected))
        new_away = round(away_elo + K_FACTOR * g * (away_actual - away_expected))

        updated[home] = new_home
        updated[away] = new_away

        changes.append({
            "match": f"{home} {home_score}-{away_score} {away}",
            "date": date,
            "homeElo": f"{home_elo} → {new_home} ({'+' if new_home >= home_elo else ''}{new_home - home_elo})",
            "awayElo": f"{away_elo} → {new_away} ({'+' if new_away >= away_elo else ''}{new_away - away_elo})",
            "gWeight": g,
        })

    return updated, changes


def compute_match_probs(home_team, away_team, elo_ratings):
    """Compute calibrated win/draw/loss probabilities from Elo."""
    home_elo = elo_ratings.get(home_team, INITIAL_ELO.get(home_team, 1800))
    away_elo = elo_ratings.get(away_team, INITIAL_ELO.get(away_team, 1800))

    # Home advantage
    elo_diff = (home_elo + HOME_ADVANTAGE) - away_elo

    # Elo-based win expectancy
    home_win_raw = 1.0 / (1.0 + math.pow(10, -elo_diff / 400.0))

    # Adjust draw probability based on Elo gap
    elo_gap = abs(elo_diff)
    if elo_gap < 30:
        draw_raw = 0.28
    elif elo_gap < 80:
        draw_raw = 0.26
    elif elo_gap < 150:
        draw_raw = 0.22
    elif elo_gap < 250:
        draw_raw = 0.18
    else:
        draw_raw = 0.12

    # Normalize so home + draw + away = 1.0
    away_win_raw = 1.0 - home_win_raw - draw_raw
    total = home_win_raw + draw_raw + away_win_raw
    home_prob = home_win_raw / total
    draw_prob = draw_raw / total
    away_prob = away_win_raw / total

    # Top scores via Poisson
    home_lambda = max(0.3, home_elo / 1200 * 1.5)
    away_lambda = max(0.3, away_elo / 1200 * 1.2)
    top_scores = poisson_scores(home_lambda, away_lambda)[:5]

    return {
        "homeWinPct": round(home_prob * 100),
        "drawPct": round(draw_prob * 100),
        "awayWinPct": round(away_prob * 100),
        "topScores": top_scores,
        "bestScore": top_scores[0] if top_scores else {"score": "1-0", "prob": 15.0},
        "eloHome": home_elo,
        "eloAway": away_elo,
        "eloDiff": elo_diff,
    }


def poisson_scores(home_lambda, away_lambda):
    """Generate top score probabilities using Poisson distribution."""
    def poisson(k, lam):
        return math.exp(-lam) * (lam ** k) / math.factorial(k)

    scores = []
    for h in range(0, 6):
        for a in range(0, 6):
            if h == 0 and a == 0:
                continue
            p = poisson(h, home_lambda) * poisson(a, away_lambda) * 100
            scores.append({"score": f"{h}-{a}", "prob": round(p, 2)})

    scores.sort(key=lambda x: x["prob"], reverse=True)
    # Normalize
    total = sum(s["prob"] for s in scores[:10])
    if total > 0:
        for s in scores[:10]:
            s["prob"] = round(s["prob"] / total * 100, 1)
    return scores[:10]


def calibrate(predictions, results):
    """Main calibration: update Elo, recompute predictions for remaining matches."""
    # Build result lookup
    result_map = {}
    for r in results:
        result_map[f"{r.get('homeTeam','')}|{r.get('awayTeam','')}"] = r

    # Update Elo from completed matches
    elo = dict(INITIAL_ELO)
    elo, elo_changes = update_elo_from_results(elo, results)

    # Split predictions into completed and remaining
    completed = []
    remaining = []
    for p in predictions:
        key = f"{p.get('homeTeam','')}|{p.get('awayTeam','')}"
        if key in result_map:
            completed.append(p)
        else:
            remaining.append(p)

    # Recalibrate remaining matches
    recalibrated = []
    for p in remaining:
        home = p.get("homeTeam", "")
        away = p.get("awayTeam", "")
        new_probs = compute_match_probs(home, away, elo)

        # Blend with original odds-based prediction (70% odds, 30% Elo)
        # Market odds are generally well-calibrated, Elo adds tournament form
        orig_h = p.get("homeWinPct", 33)
        orig_d = p.get("drawPct", 34)
        orig_a = p.get("awayWinPct", 33)

        recalibrated.append({
            **p,
            "homeWinPct_orig": orig_h,
            "drawPct_orig": orig_d,
            "awayWinPct_orig": orig_a,
            "homeWinPct": round(orig_h * 0.7 + new_probs["homeWinPct"] * 0.3),
            "drawPct": round(orig_d * 0.7 + new_probs["drawPct"] * 0.3),
            "awayWinPct": round(orig_a * 0.7 + new_probs["awayWinPct"] * 0.3),
            "topScores": new_probs["topScores"],
            "bestScore": new_probs["bestScore"],
            "eloHome": new_probs["eloHome"],
            "eloAway": new_probs["eloAway"],
            "calibrated": True,
            "calibratedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        })

    # Return complete prediction set (completed unchanged + recalibrated remaining)
    return {
        "calibratedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "eloRatings": {team: elo[team] for team in sorted(elo.keys())},
        "eloChanges": elo_changes,
        "summary": {
            "total": len(predictions),
            "completed": len(completed),
            "remaining": len(remaining),
            "recalibrated": len(recalibrated),
        },
        "predictions": completed + recalibrated,
    }


def main():
    apply_flag = "--apply" in sys.argv
    json_flag = "--json" in sys.argv

    # Load data
    pred_path = os.path.join(PROJECT_DIR, "worldcup-predictions.json")
    results_path = os.path.join(PROJECT_DIR, "match-results.json")

    predictions = []
    results = []

    for path in [pred_path, os.path.join(PROJECT_DIR, "apps", "web", "public", "worldcup-predictions.json")]:
        try:
            predictions = load_json(path)
            if len(predictions) > 0:
                break
        except Exception:
            continue

    if not predictions:
        predictions = load_json("http://121.40.140.216:3000/worldcup-predictions.json")

    for path in [results_path, os.path.join(PROJECT_DIR, "apps", "web", "public", "match-results.json")]:
        try:
            data = load_json(path)
            results = data.get("results", data) if isinstance(data, dict) else data
            if len(results) > 0:
                break
        except Exception:
            continue

    if not results:
        data = load_json("http://121.40.140.216:3000/match-results.json")
        results = data.get("results", data) if isinstance(data, dict) else data

    results = results if isinstance(results, list) else []

    # Run calibration
    output = calibrate(predictions, results)

    if json_flag:
        # Output only the predictions list (compatible with worldcup-predictions.json)
        clean_preds = []
        for p in output["predictions"]:
            clean = {k: v for k, v in p.items() if not k.startswith("elo") and not k.endswith("_orig")}
            clean_preds.append(clean)
        print(json.dumps(clean_preds, indent=2, ensure_ascii=False))
        return

    # Print summary
    print("🔄 Elo 校准报告")
    print(f"  总场次: {output['summary']['total']}")
    print(f"  已完赛: {output['summary']['completed']}")
    print(f"  剩余:   {output['summary']['remaining']}")
    print(f"  已重新校准: {output['summary']['recalibrated']}")
    print()
    print("📊 Elo 变动:")
    for c in output["eloChanges"]:
        print(f"  {c['date']}  {c['match']}")
        print(f"    主: {c['homeElo']}  客: {c['awayElo']}  权重: x{c['gWeight']}")
    print()

    if output["eloChanges"]:
        print("🏆 更新后 Elo Top 10:")
        elo_items = list(output["eloRatings"].items())
        sorted_teams = sorted(elo_items, key=lambda x: x[1], reverse=True)[:10]
        for team, rating in sorted_teams:
            initial = INITIAL_ELO.get(team, 1800)
            diff = rating - initial
            sign = "+" if diff >= 0 else ""
            print(f"  {team:25s} {rating} ({sign}{diff})")

    if apply_flag:
        out_path = os.path.join(PROJECT_DIR, "worldcup-predictions-calibrated.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output["predictions"], f, indent=2, ensure_ascii=False)
        print(f"\n✅ 已写入 {out_path}")


if __name__ == "__main__":
    main()
