#!/usr/bin/env python3
"""Merge knockout + group with bet365 odds, knockout first."""
import json, os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

ODDS = {
    'South Africa|Canada': (5.5, 3.8, 1.65),
    'Brazil|Japan': (1.67, 3.75, 5.25),
    'Germany|Paraguay': (1.36, 5.0, 8.5),
    'Netherlands|Morocco': (2.1, 3.2, 3.8),
    'Ivory Coast|Norway': (3.6, 3.6, 2.0),
    'France|Sweden': (1.29, 5.75, 10.0),
    'Mexico|Ecuador': (2.15, 3.0, 3.9),
    'England|DR Congo': (1.29, 5.5, 12.0),
    'Belgium|Senegal': (2.05, 3.2, 4.0),
    'USA|Bosnia & Herzegovina': (1.36, 5.0, 8.5),
    'Spain|Austria': (1.27, 5.0, 17.0),
    'Portugal|Croatia': (1.83, 3.3, 4.75),
    'Switzerland|Algeria': (1.91, 3.25, 4.33),
    'Australia|Egypt': (3.25, 2.88, 2.5),
    'Argentina|Cape Verde': (1.13, 6.5, 19.0),
    'Colombia|Ghana': (1.62, 3.6, 6.25),
}

for loc in [PROJECT_DIR, os.path.join(PROJECT_DIR, 'apps', 'web', 'public')]:
    path = os.path.join(loc, 'worldcup-predictions.json')
    try:
        p = json.load(open(path))
        for x in p:
            k = x['homeTeam'] + '|' + x['awayTeam']
            if k in ODDS and x.get('knockout'):
                x['oddsHome'], x['oddsDraw'], x['oddsAway'] = ODDS[k]
                x['source'] = 'bet365'
        ko = [x for x in p if x.get('knockout')]
        gp = [x for x in p if not x.get('knockout')]
        new = ko + gp
        json.dump(new, open(path, 'w'), indent=2)
        print(f'{len(ko)}+{len(gp)}={len(new)} -> {path}')
    except Exception as e:
        print(f'Error {path}: {e}')
