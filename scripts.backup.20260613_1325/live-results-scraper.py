#!/usr/bin/env python3
"""
2026 World Cup Live Results Scraper
Uses ESPN public API (free, no auth required) to fetch live match results.
Generates match-results.json compatible with the ai-sports-os prediction site.

Usage:
    python3 scripts/live-results-scraper.py                    # print JSON to stdout
    python3 scripts/live-results-scraper.py --write            # write to apps/web/public/match-results.json
    python3 scripts/live-results-scraper.py --post http://...  # POST to a server endpoint
"""

import json
import urllib.request
import urllib.error
import sys
import os
import ssl
import subprocess
from datetime import datetime, timezone

ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260612-20260720"

# Map ESPN display names → user's prediction data format
NAME_MAP = {
    "Canada": "Canada",
    "Bosnia-Herzegovina": "Bosnia & Herzegovina",
    "United States": "USA",
    "Paraguay": "Paraguay",
    "Switzerland": "Switzerland",
    "Qatar": "Qatar",
    "Morocco": "Morocco",
    "Brazil": "Brazil",
    "Scotland": "Scotland",
    "Haiti": "Haiti",
    "Türkiye": "Turkey",
    "Australia": "Australia",
    "Curaçao": "Curaçao",
    "Germany": "Germany",
    "Japan": "Japan",
    "Netherlands": "Netherlands",
    "Ecuador": "Ecuador",
    "Ivory Coast": "Ivory Coast",
    "Tunisia": "Tunisia",
    "Sweden": "Sweden",
    "Cape Verde": "Cape Verde",
    "Spain": "Spain",
    "Egypt": "Egypt",
    "Belgium": "Belgium",
    "Uruguay": "Uruguay",
    "Saudi Arabia": "Saudi Arabia",
    "New Zealand": "New Zealand",
    "Iran": "Iran",
    "Senegal": "Senegal",
    "France": "France",
    "Norway": "Norway",
    "Iraq": "Iraq",
    "Algeria": "Algeria",
    "Argentina": "Argentina",
    "Jordan": "Jordan",
    "Austria": "Austria",
    "Congo DR": "DR Congo",
    "Portugal": "Portugal",
    "Croatia": "Croatia",
    "England": "England",
    "Panama": "Panama",
    "Ghana": "Ghana",
    "Colombia": "Colombia",
    "Uzbekistan": "Uzbekistan",
    "South Africa": "South Africa",
    "Czechia": "Czech Republic",
    "South Korea": "South Korea",
    "Mexico": "Mexico",
}


def fetch_scoreboard():
    """Fetch all World Cup 2026 matches from ESPN API."""
    url = ESPN_SCOREBOARD
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AISportsOS/1.0)"}

    # Try curl subprocess first (handles SSL better on macOS LibreSSL)
    try:
        result = subprocess.run(
            ["curl", "-s", "--compressed", "-H", f"User-Agent: {headers['User-Agent']}", url],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError):
        pass

    # Fall back to urllib with unverified SSL
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"Error fetching ESPN API: {e}", file=sys.stderr)
        return None


def parse_results(data):
    """Extract match results from ESPN scoreboard JSON."""
    results = []
    events = data.get("events", []) if data else []

    for event in events:
        competitions = event.get("competitions", [])
        if not competitions:
            continue

        comp = competitions[0]
        competitors = comp.get("competitors", [])
        if len(competitors) < 2:
            continue

        home = competitors[0]
        away = competitors[1]
        status = comp.get("status", {}).get("type", {})

        # Only include matches that have a score (completed or in-progress)
        home_score = home.get("score")
        away_score = away.get("score")
        if home_score is None or away_score is None:
            continue

        # Only include if match is finished (Full Time) or has actual scores
        if not status.get("completed") and home_score == "0" and away_score == "0":
            continue

        home_name_raw = home.get("team", {}).get("displayName", "")
        away_name_raw = away.get("team", {}).get("displayName", "")
        home_name = NAME_MAP.get(home_name_raw, home_name_raw)
        away_name = NAME_MAP.get(away_name_raw, away_name_raw)

        match_date = (event.get("date", "") or "")[:10]
        recorded_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")

        try:
            hs = int(home_score)
            as_ = int(away_score)
        except (ValueError, TypeError):
            continue

        results.append({
            "homeTeam": home_name,
            "awayTeam": away_name,
            "homeScore": hs,
            "awayScore": as_,
            "date": match_date,
            "status": status.get("shortDetail", status.get("name", "")),
            "clock": comp.get("status", {}).get("displayClock", ""),
            "recordedAt": recorded_at,
        })

    return results


def compute_team_stats(results):
    """Compute per-team tournament stats from results."""
    stats = {}
    for r in results:
        for side, opp_side in [("homeTeam", "awayTeam"), ("awayTeam", "homeTeam")]:
            team = r[side]
            opp = r[opp_side]
            gf = r["homeScore"] if side == "homeTeam" else r["awayScore"]
            ga = r["awayScore"] if side == "homeTeam" else r["homeScore"]

            if team not in stats:
                stats[team] = {"gp": 0, "gf": 0, "ga": 0, "w": 0, "d": 0, "l": 0}

            s = stats[team]
            s["gp"] += 1
            s["gf"] += gf
            s["ga"] += ga
            if gf > ga:
                s["w"] += 1
            elif gf == ga:
                s["d"] += 1
            else:
                s["l"] += 1

    # Add per-game averages
    for team, s in stats.items():
        gp = max(s["gp"], 1)
        s["gpg"] = round(s["gf"] / gp, 2)
        s["gapg"] = round(s["ga"] / gp, 2)

    return stats


def build_output(results):
    """Build the complete match-results.json output."""
    team_stats = compute_team_stats(results)
    return {
        "description": "World Cup 2026 actual match results. Auto-updated from ESPN API.",
        "lastUpdated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "ESPN API (site.api.espn.com)",
        "results": results,
        "teamStats": team_stats,
    }


def main():
    write_flag = "--write" in sys.argv
    post_flag = any(a.startswith("--post=") for a in sys.argv)
    post_url = None
    if post_flag:
        post_url = next(a.split("=", 1)[1] for a in sys.argv if a.startswith("--post="))

    data = fetch_scoreboard()
    if data is None:
        sys.exit(1)

    results = parse_results(data)
    output = build_output(results)

    json_str = json.dumps(output, indent=2, ensure_ascii=False)

    if write_flag:
        # Merge with existing results to preserve manually entered data
        existing_results = []
        for loc in [
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "match-results.json"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "web", "public", "match-results.json"),
        ]:
            try:
                with open(loc, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    existing = data.get("results", data) if isinstance(data, dict) else data
                    if isinstance(existing, list):
                        existing_results = existing
                        break
            except Exception:
                continue

        # Merge: existing results + new scraped results (newer wins)
        merged_map = {}
        for r in existing_results:
            key = f"{r.get('homeTeam','')}|{r.get('awayTeam','')}|{r.get('date','')}"
            merged_map[key] = r
        for r in results:
            key = f"{r.get('homeTeam','')}|{r.get('awayTeam','')}|{r.get('date','')}"
            merged_map[key] = r  # scraped data wins for same key

        merged_results = list(merged_map.values())
        merged_output = build_output(merged_results)
        merged_json = json.dumps(merged_output, indent=2, ensure_ascii=False)

        out_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "apps", "web", "public", "match-results.json",
        )
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(merged_json)
        print(f"Written {len(merged_results)} results ({len(existing_results)} existing + {len(results)} new) to {out_path}", file=sys.stderr)
        # Also write to project root
        root_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "match-results.json",
        )
        with open(root_path, "w", encoding="utf-8") as f:
            f.write(merged_json)

    if post_url:
        # Send with secret for API auth
        post_body = json.dumps({**output, "secret": "wc2026-predict"}).encode("utf-8")
        req = urllib.request.Request(
            post_url,
            data=post_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10, context=ssl._create_unverified_context()) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                print(f"POST {post_url} → {resp.status}: {resp_data.get('message', 'OK')}", file=sys.stderr)
        except urllib.error.URLError as e:
            print(f"POST failed: {e}", file=sys.stderr)
        except Exception as e:
            # Fallback: try curl subprocess for POST
            try:
                result = subprocess.run(
                    ["curl", "-s", "-X", "POST", post_url,
                     "-H", "Content-Type: application/json",
                     "-d", post_body.decode("utf-8")],
                    capture_output=True, text=True, timeout=15,
                )
                print(f"POST (curl) {post_url} → {result.stdout[:200]}", file=sys.stderr)
            except Exception as e2:
                print(f"POST failed (curl fallback): {e2}", file=sys.stderr)

    # Always print match summary to stderr
    for r in results:
        clock = f" ({r['clock']})" if r.get("clock") and r["clock"] != "0.0" else ""
        print(
            f"  {r['date']}  {r['homeTeam']} {r['homeScore']}-{r['awayScore']} {r['awayTeam']}  {r.get('status','')}{clock}",
            file=sys.stderr,
        )
    print(f"\nTotal: {len(results)} results, {len(output['teamStats'])} teams", file=sys.stderr)

    # Print to stdout
    if not write_flag and not post_flag:
        print(json_str)


if __name__ == "__main__":
    main()
