#!/usr/bin/env python3
"""
Prediction Accuracy Tracker
Compares worldcup-predictions.json against match-results.json
and outputs accuracy statistics.

Usage:
    python3 scripts/compute-accuracy.py                     # print stats to stdout
    python3 scripts/compute-accuracy.py --json               # output JSON for API
    python3 scripts/compute-accuracy.py --watch              # monitor mode (re-run on interval)
"""

import json
import sys
import os
from datetime import datetime, timezone
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# Try to load data from files, fall back to HTTP fetch
def load_json(source):
    """Load JSON from file path or HTTP URL."""
    if source.startswith("http://") or source.startswith("https://"):
        import urllib.request
        try:
            req = urllib.request.Request(source, headers={"User-Agent": "AISportsOS/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"Error fetching {source}: {e}", file=sys.stderr)
            return None
    else:
        try:
            with open(source, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            return None


def load_data():
    """Load predictions and results from local files or server."""
    # Try local files first
    pred_path = os.path.join(PROJECT_DIR, "worldcup-predictions.json")
    results_path = os.path.join(PROJECT_DIR, "match-results.json")
    web_public = os.path.join(PROJECT_DIR, "apps", "web", "public")

    # Check multiple locations
    predictions = None
    results = None

    for loc in [pred_path, os.path.join(web_public, "worldcup-predictions.json")]:
        predictions = load_json(loc)
        if predictions and len(predictions) > 0:
            break

    for loc in [results_path, os.path.join(web_public, "match-results.json")]:
        results = load_json(loc)
        if results:
            break

    # Fall back to server
    if not predictions:
        predictions = load_json("http://121.40.140.216:3000/worldcup-predictions.json")
    if not results:
        results = load_json("http://121.40.140.216:3000/match-results.json")

    # Normalize results format
    if isinstance(results, dict):
        results_list = results.get("results", [])
    elif isinstance(results, list):
        results_list = results
    else:
        results_list = []

    return predictions or [], results_list


def normalize_team(name):
    """Normalize team names for matching."""
    # ESPN uses different names sometimes
    mapping = {
        "Czechia": "Czech Republic",
        "Türkiye": "Turkey",
        "Bosnia-Herzegovina": "Bosnia & Herzegovina",
        "Ivory Coast": "Ivory Coast",
        "Congo DR": "DR Congo",
    }
    return mapping.get(name, name)


def compare_predictions(predictions, results):
    """Compare predictions against actual results and compute accuracy."""
    # Build result lookup
    result_map = {}
    for r in results:
        key = f"{r.get('homeTeam','')}|{r.get('awayTeam','')}"
        # Also try reversed and normalized
        result_map[key] = r
        # Normalized
        h_norm = normalize_team(r.get("homeTeam", ""))
        a_norm = normalize_team(r.get("awayTeam", ""))
        result_map[f"{h_norm}|{a_norm}"] = r

    matches = []
    correct_outcome = 0
    correct_score = 0
    total = 0
    by_date = defaultdict(lambda: {"correct": 0, "total": 0})

    for p in predictions:
        home = p.get("homeTeam", "")
        away = p.get("awayTeam", "")
        date = p.get("date", "")

        # Try to find result
        result = result_map.get(f"{home}|{away}") or result_map.get(f"{away}|{home}")

        if not result:
            continue

        total += 1
        home_score = int(result.get("homeScore", 0))
        away_score = int(result.get("awayScore", 0))

        # Determine actual outcome
        if home_score > away_score:
            actual = "home"
        elif home_score == away_score:
            actual = "draw"
        else:
            actual = "away"

        # Determine predicted outcome
        h_pct = float(p.get("homeWinPct", p.get("homeWinProb", 33)))
        d_pct = float(p.get("drawPct", p.get("drawProb", 34)))
        a_pct = float(p.get("awayWinPct", p.get("awayWinProb", 33)))

        if h_pct >= d_pct and h_pct >= a_pct:
            predicted = "home"
        elif d_pct >= h_pct and d_pct >= a_pct:
            predicted = "draw"
        else:
            predicted = "away"

        outcome_correct = predicted == actual

        # Score exact
        best_score = p.get("bestScore", {})
        if isinstance(best_score, dict):
            best = best_score.get("score", "")
        elif isinstance(best_score, str):
            best = best_score
        else:
            best = ""
        score_correct = best == f"{home_score}-{away_score}"

        if outcome_correct:
            correct_outcome += 1
        if score_correct:
            correct_score += 1

        by_date[date]["total"] += 1
        if outcome_correct:
            by_date[date]["correct"] += 1

        matches.append({
            "date": date,
            "homeTeam": home,
            "awayTeam": away,
            "predicted": predicted,
            "actual": actual,
            "predictedScore": best,
            "actualScore": f"{home_score}-{away_score}",
            "homeWinPct": h_pct,
            "drawPct": d_pct,
            "awayWinPct": a_pct,
            "outcomeCorrect": outcome_correct,
            "scoreCorrect": score_correct,
        })

    # Compute streak (consecutive correct from most recent)
    streak = 0
    for m in sorted(matches, key=lambda x: x["date"], reverse=True):
        if m["outcomeCorrect"]:
            streak += 1
        else:
            break

    return {
        "computedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": {
            "totalMatches": total,
            "correctOutcomes": correct_outcome,
            "correctScores": correct_score,
            "outcomeAccuracy": round(correct_outcome / max(total, 1) * 100, 1),
            "scoreAccuracy": round(correct_score / max(total, 1) * 100, 1),
            "currentStreak": streak,
        },
        "byDate": {date: {"total": d["total"], "correct": d["correct"],
                           "accuracy": round(d["correct"] / max(d["total"], 1) * 100, 1)}
                    for date, d in sorted(by_date.items())},
        "matches": sorted(matches, key=lambda x: x["date"]),
    }


def main():
    predictions, results = load_data()
    if not predictions:
        print("Error: No predictions data found", file=sys.stderr)
        sys.exit(1)

    stats = compare_predictions(predictions, results)

    if "--json" in sys.argv:
        print(json.dumps(stats, indent=2, ensure_ascii=False))
    else:
        s = stats["summary"]
        print(f"🎯 AI 预测准确率报告 — {stats['computedAt'][:16]}")
        print(f"  已完赛: {s['totalMatches']} 场")
        print(f"  胜平负正确: {s['correctOutcomes']}/{s['totalMatches']} ({s['outcomeAccuracy']}%)")
        print(f"  比分正确: {s['correctScores']}/{s['totalMatches']} ({s['scoreAccuracy']}%)")
        print(f"  连续正确: {s['currentStreak']} 场")
        print()
        for date, d in sorted(stats["byDate"].items()):
            bar = "█" * (d["correct"]) + "░" * (d["total"] - d["correct"])
            print(f"  {date}  {bar}  {d['correct']}/{d['total']} ({d['accuracy']}%)")
        print()
        for m in stats["matches"]:
            icon = "✅" if m["outcomeCorrect"] else "❌"
            print(f"  {icon} {m['date']}  {m['homeTeam']} {m['actualScore']} {m['awayTeam']}  预测: {m['predicted']} 实际: {m['actual']}")


if __name__ == "__main__":
    main()
