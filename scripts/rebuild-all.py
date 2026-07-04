#!/usr/bin/env python3
"""One script: generate 88 predictions with KO tags. Never loses data."""
import json, math, os, subprocess, sys

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── 16 KO matches with bet365 odds ──
KO_MATCHES = [
    ('2026-06-29','South Africa','Canada','03:00'),
    ('2026-06-30','Brazil','Japan','01:00'),
    ('2026-06-30','Germany','Paraguay','04:30'),
    ('2026-06-30','Netherlands','Morocco','09:00'),
    ('2026-07-01','France','Sweden','05:00'),
    ('2026-07-01','Ivory Coast','Norway','01:00'),
    ('2026-07-01','Mexico','Ecuador','09:00'),
    ('2026-07-02','England','DR Congo','00:00'),
    ('2026-07-02','Belgium','Senegal','04:00'),
    ('2026-07-02','USA','Bosnia & Herzegovina','08:00'),
    ('2026-07-03','Spain','Austria','03:00'),
    ('2026-07-03','Portugal','Croatia','07:00'),
    ('2026-07-03','Switzerland','Algeria','11:00'),
    ('2026-07-04','Argentina','Cape Verde','06:00'),
    ('2026-07-04','Australia','Egypt','02:00'),
    ('2026-07-04','Colombia','Ghana','09:30'),
    # Round of 16
    ('2026-07-05','Canada','Morocco','00:00'),
    ('2026-07-05','Paraguay','France','04:00'),
    ('2026-07-06','Brazil','Norway','03:00'),
    ('2026-07-06','Mexico','England','07:00'),
    ('2026-07-07','Portugal','Spain','02:00'),
    ('2026-07-07','USA','Belgium','07:00'),
    ('2026-07-07','Argentina','Egypt','23:00'),
    ('2026-07-08','Switzerland','Colombia','03:00'),
]
ODDS = {
    'South Africa|Canada':(5.5,3.8,1.65),'Brazil|Japan':(1.67,3.75,5.25),
    'Germany|Paraguay':(1.36,5.0,8.5),'Netherlands|Morocco':(2.1,3.2,3.8),
    'Ivory Coast|Norway':(3.6,3.6,2.0),'France|Sweden':(1.29,5.75,10.0),
    'Mexico|Ecuador':(2.15,3.0,3.9),'England|DR Congo':(1.29,5.5,12.0),
    'Belgium|Senegal':(2.05,3.2,4.0),'USA|Bosnia & Herzegovina':(1.36,5.0,8.5),
    'Spain|Austria':(1.27,5.0,17.0),'Portugal|Croatia':(1.83,3.3,4.75),
    'Switzerland|Algeria':(1.91,3.25,4.33),'Australia|Egypt':(3.25,2.88,2.5),
    'Argentina|Cape Verde':(1.13,6.5,19.0),'Colombia|Ghana':(1.62,3.6,6.25),
    'Canada|Morocco':(2.5,3.1,3.0),'Paraguay|France':(7.0,4.2,1.5),
    'Brazil|Norway':(1.8,3.5,4.5),'Mexico|England':(3.5,3.2,2.2),
    'Portugal|Spain':(2.8,3.1,2.7),'USA|Belgium':(2.6,3.2,2.8),
    'Argentina|Egypt':(1.22,6.0,13.0),'Switzerland|Colombia':(2.9,3.0,2.6),
}

# Generate KO predictions
ko = []
for d,h,a,t in KO_MATCHES:
    oh,od,oa = ODDS.get(f'{h}|{a}',(2.0,3.2,2.0))
    ko.append({'date':d,'homeTeam':h,'awayTeam':a,'kickoff':t,
               'oddsHome':oh,'oddsDraw':od,'oddsAway':oa,
               'homeWinPct':33,'drawPct':34,'awayWinPct':33,
               'source':'bet365','knockout':True})

# Load group predictions (from backup or existing)
gp_path = os.path.join(PROJECT_DIR,'worldcup-predictions-gp.json')
try:
    gp = json.load(open(gp_path))
except:
    # Fallback: read existing and remove KO entries
    p = json.load(open(os.path.join(PROJECT_DIR,'worldcup-predictions.json')))
    gp = [x for x in p if not x.get('knockout')]
    json.dump(gp, open(gp_path,'w'), indent=2)  # save for future

# Merge KO first, generate v3
merged = ko + gp
json.dump(merged, open(os.path.join(PROJECT_DIR,'worldcup-predictions.json'),'w'), indent=2)

# Run v3
predict_script = os.path.join(PROJECT_DIR,'scripts','predict-v3.py')
result = subprocess.run(['python3',predict_script,'--apply'], capture_output=True, text=True, cwd=PROJECT_DIR)

# Reorder: KO first, ensure topScores exist
p2 = json.load(open(os.path.join(PROJECT_DIR,'worldcup-predictions.json')))
for x in p2:
    if x.get('knockout') and not x.get('topScores'):
        # Generate basic score distribution from odds
        import math as _m
        oh,od,oa = x.get('oddsHome',2), x.get('oddsDraw',3.5), x.get('oddsAway',3.5)
        hp,dp,ap = 1/oh, 1/od, 1/oa
        margin = (hp+dp+ap-1)/3
        hc,dc,ac = max(.02,hp-margin), max(.02,dp-margin), max(.02,ap-margin)
        total = hc+dc+ac
        x['homeWinPct'] = round(hc/total*100); x['drawPct'] = round(dc/total*100); x['awayWinPct'] = round(ac/total*100)
        # Simple Poisson-based top scores
        lh = max(0.3, x['homeWinPct']/50); la = max(0.3, x['awayWinPct']/50)
        scores = []
        for h in range(8):
            for a in range(8):
                p = (_m.exp(-lh)*lh**h/_m.factorial(h)) * (_m.exp(-la)*la**a/_m.factorial(a)) * 100
                scores.append({'score':f'{h}-{a}','prob':round(p,2)})
        scores.sort(key=lambda s:-s['prob'])
        top = scores[:10]; t = sum(s['prob'] for s in top)
        if t > 0:
            for s in top: s['prob'] = round(s['prob']/t*100,1)
        x['topScores'] = top; x['bestScore'] = top[0]
ko_out = [x for x in p2 if x.get('knockout')]
gp_out = [x for x in p2 if not x.get('knockout')]
final = ko_out + gp_out

# Write
for loc in ['','apps/web/public/']:
    path = os.path.join(PROJECT_DIR, loc, 'worldcup-predictions.json')
    json.dump(final, open(path, 'w'), indent=2)

print(f'{len(ko_out)} KO + {len(gp_out)} GP = {len(final)} total')
