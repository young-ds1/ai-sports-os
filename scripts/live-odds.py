#!/usr/bin/env python3
"""Live odds updater via The Odds API. Updates knockout predictions with real-time odds."""
import json, urllib.request, ssl, os, math

API_KEY = '2355d53f733a5ce96e9cab3157c99cfc'
API_URL = 'https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ctx = ssl._create_unverified_context()

# Team name mapping: API name → our name
NAME_MAP = {
    'Brazil': 'Brazil', 'Japan': 'Japan', 'Germany': 'Germany',
    'Paraguay': 'Paraguay', 'Netherlands': 'Netherlands', 'Morocco': 'Morocco',
    'France': 'France', 'Sweden': 'Sweden', 'Mexico': 'Mexico',
    'Ecuador': 'Ecuador', 'England': 'England',
    'DR Congo': 'DR Congo', 'Belgium': 'Belgium', 'Senegal': 'Senegal',
    'USA': 'USA', 'Bosnia & Herzegovina': 'Bosnia & Herzegovina',
    'Spain': 'Spain', 'Austria': 'Austria', 'Portugal': 'Portugal',
    'Croatia': 'Croatia', 'Switzerland': 'Switzerland', 'Algeria': 'Algeria',
    'Australia': 'Australia', 'Egypt': 'Egypt', 'Argentina': 'Argentina',
    'Cape Verde': 'Cape Verde', 'Colombia': 'Colombia', 'Ghana': 'Ghana',
    'Norway': 'Norway', 'Ivory Coast': 'Ivory Coast',
    'South Africa': 'South Africa', 'Canada': 'Canada',
}

def fetch_odds():
    try:
        url = f'{API_URL}?apiKey={API_KEY}&regions=eu&markets=h2h'
        req = urllib.request.Request(url, headers={'User-Agent': 'AISportsOS/1.0'})
        resp = urllib.request.urlopen(req, timeout=15, context=ctx)
        data = json.loads(resp.read().decode('utf-8'))
        if isinstance(data, dict) and 'message' in data:
            print(f'API error: {data["message"]}')
            return None
        odds_map = {}
        for game in data:
            h_raw = game.get('home_team', '')
            a_raw = game.get('away_team', '')
            h = NAME_MAP.get(h_raw, h_raw)
            a = NAME_MAP.get(a_raw, a_raw)
            # Average across bookmakers for stability
            prices_h, prices_d, prices_a = [], [], []
            for b in game.get('bookmakers', []):
                for m in b.get('markets', []):
                    if m.get('key') == 'h2h':
                        outcomes = m.get('outcomes', [])
                        if len(outcomes) >= 3:
                            prices_h.append(outcomes[0]['price'])
                            prices_a.append(outcomes[1]['price'])
                            prices_d.append(outcomes[2]['price'])
            if prices_h:
                oh = round(sum(prices_h)/len(prices_h), 2)
                od = round(sum(prices_d)/len(prices_d), 2)
                oa = round(sum(prices_a)/len(prices_a), 2)
                odds_map[f'{h}|{a}'] = (oh, od, oa)
        return odds_map
    except Exception as e:
        print(f'Fetch error: {e}')
        return None

def update_predictions():
    odds = fetch_odds()
    if not odds: return 0

    paths = [
        os.path.join(PROJECT_DIR, 'worldcup-predictions.json'),
        os.path.join(PROJECT_DIR, 'apps', 'web', 'public', 'worldcup-predictions.json'),
    ]
    for path in paths:
        try:
            p = json.load(open(path))
            updated = 0
            for m in p:
                if not m.get('knockout'): continue
                k = f'{m["homeTeam"]}|{m["awayTeam"]}'
                if k in odds:
                    oh, od, oa = odds[k]
                    old_oh = m.get('oddsHome', 0)
                    if abs(oh - old_oh) > 0.01:
                        m['oddsHome'] = oh; m['oddsDraw'] = od; m['oddsAway'] = oa
                        m['source'] = 'live-odds-api'
                        updated += 1
            if updated > 0:
                json.dump(p, open(path, 'w'), indent=2, ensure_ascii=False)
            print(f'{path}: {updated} updated')
        except Exception as e:
            print(f'{path}: {e}')
    return updated

if __name__ == '__main__':
    n = update_predictions()
    print(f'Live odds: {n} matches updated')
