#!/usr/bin/env python3
"""
Dimension Validation Backtest
Tests each prediction dimension against WC 2010-2022 (192 matches).
Outputs Brier Score, Outcome Accuracy, and marginal gain per dimension.
"""
import json, math, sys, os
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# ── All 192 matches ── (abbreviated from historical data)
ELO_22 = {'Brazil':2138,'Argentina':2119,'France':2102,'England':2087,'Spain':2073,'Portugal':2053,'Netherlands':2046,'Germany':2041,'Belgium':2031,'Uruguay':2014,'Croatia':2005,'Denmark':1992,'Switzerland':1978,'Senegal':1967,'USA':1955,'Mexico':1948,'Morocco':1941,'Japan':1936,'Serbia':1930,'Iran':1927,'South Korea':1922,'Poland':1918,'Wales':1913,'Australia':1905,'Ecuador':1898,'Tunisia':1892,'Cameroon':1885,'Canada':1880,'Costa Rica':1870,'Saudi Arabia':1865,'Ghana':1860,'Qatar':1850}
M22 = [('Qatar','Ecuador',0,2),('England','Iran',6,2),('Senegal','Netherlands',0,2),('USA','Wales',1,1),('Argentina','Saudi Arabia',1,2),('Denmark','Tunisia',0,0),('Mexico','Poland',0,0),('France','Australia',4,1),('Morocco','Croatia',0,0),('Germany','Japan',1,2),('Spain','Costa Rica',7,0),('Belgium','Canada',1,0),('Switzerland','Cameroon',1,0),('Uruguay','South Korea',0,0),('Portugal','Ghana',3,2),('Brazil','Serbia',2,0),('Wales','Iran',0,2),('Qatar','Senegal',1,3),('Netherlands','Ecuador',1,1),('England','USA',0,0),('Tunisia','Australia',0,1),('Poland','Saudi Arabia',2,0),('France','Denmark',2,1),('Argentina','Mexico',2,0),('Japan','Costa Rica',0,1),('Belgium','Morocco',0,2),('Croatia','Canada',4,1),('Spain','Germany',1,1),('Cameroon','Serbia',3,3),('South Korea','Ghana',2,3),('Brazil','Switzerland',1,0),('Portugal','Uruguay',2,0),('Netherlands','Qatar',2,0),('Ecuador','Senegal',1,2),('Wales','England',0,3),('Iran','USA',0,1),('Australia','Denmark',1,0),('Tunisia','France',1,0),('Poland','Argentina',0,2),('Saudi Arabia','Mexico',1,2),('Croatia','Belgium',0,0),('Canada','Morocco',1,2),('Japan','Spain',2,1),('Costa Rica','Germany',2,4),('Ghana','Uruguay',0,2),('South Korea','Portugal',2,1),('Serbia','Switzerland',2,3),('Cameroon','Brazil',1,0)]
ELO_18 = {'Brazil':2131,'Germany':2102,'Spain':2088,'France':2071,'Argentina':2059,'Portugal':2056,'Belgium':2043,'England':2024,'Uruguay':2001,'Croatia':1994,'Colombia':1985,'Switzerland':1975,'Denmark':1952,'Mexico':1940,'Sweden':1932,'Senegal':1930,'Serbia':1918,'Iran':1915,'South Korea':1910,'Japan':1902,'Australia':1898,'Morocco':1890,'Nigeria':1885,'Costa Rica':1880,'Iceland':1878,'Egypt':1875,'Russia':1870,'Poland':1865,'Tunisia':1852,'Peru':1848,'Panama':1835,'Saudi Arabia':1830}
M18 = [('Russia','Saudi Arabia',5,0),('Egypt','Uruguay',0,1),('Morocco','Iran',0,1),('Portugal','Spain',3,3),('France','Australia',2,1),('Argentina','Iceland',1,1),('Peru','Denmark',0,1),('Croatia','Nigeria',2,0),('Costa Rica','Serbia',0,1),('Germany','Mexico',0,1),('Brazil','Switzerland',1,1),('Sweden','South Korea',1,0),('Belgium','Panama',3,0),('Tunisia','England',1,2),('Colombia','Japan',1,2),('Poland','Senegal',1,2),('Russia','Egypt',3,1),('Portugal','Morocco',1,0),('Uruguay','Saudi Arabia',1,0),('Iran','Spain',0,1),('Denmark','Australia',1,1),('France','Peru',1,0),('Argentina','Croatia',0,3),('Brazil','Costa Rica',2,0),('Nigeria','Iceland',2,0),('Serbia','Switzerland',1,2),('Belgium','Tunisia',5,2),('South Korea','Mexico',1,2),('Germany','Sweden',2,1),('England','Panama',6,1),('Japan','Senegal',2,2),('Poland','Colombia',0,3),('Uruguay','Russia',3,0),('Saudi Arabia','Egypt',2,1),('Spain','Morocco',2,2),('Iran','Portugal',1,1),('Australia','Peru',0,2),('Denmark','France',0,0),('Nigeria','Argentina',1,2),('Iceland','Croatia',1,2),('South Korea','Germany',2,0),('Mexico','Sweden',0,3),('Switzerland','Costa Rica',2,2),('Serbia','Brazil',0,2),('Japan','Poland',0,1),('Senegal','Colombia',0,1),('Panama','Tunisia',1,2),('England','Belgium',0,1)]
ELO_14 = {'Brazil':2138,'Spain':2120,'Germany':2104,'Argentina':2095,'Netherlands':2076,'Portugal':2061,'England':2050,'Belgium':2040,'Uruguay':2030,'Colombia':2025,'Italy':2020,'France':2018,'Croatia':2000,'Switzerland':1985,'Chile':1980,'Greece':1965,'USA':1955,'Mexico':1950,'Ecuador':1940,'Russia':1932,'Algeria':1930,'Ivory Coast':1925,'Japan':1920,'South Korea':1910,'Bosnia-Herzegovina':1905,'Ghana':1900,'Costa Rica':1890,'Nigeria':1885,'Iran':1875,'Cameroon':1870,'Australia':1865,'Honduras':1850}
M14 = [('Brazil','Croatia',3,1),('Mexico','Cameroon',1,0),('Spain','Netherlands',1,5),('Chile','Australia',3,1),('Colombia','Greece',3,0),('Ivory Coast','Japan',2,1),('Uruguay','Costa Rica',1,3),('England','Italy',1,2),('Switzerland','Ecuador',2,1),('France','Honduras',3,0),('Argentina','Bosnia-Herzegovina',2,1),('Iran','Nigeria',0,0),('Germany','Portugal',4,0),('Ghana','USA',1,2),('Belgium','Algeria',2,1),('Brazil','Mexico',0,0),('Russia','South Korea',1,1),('Australia','Netherlands',2,3),('Spain','Chile',0,2),('Cameroon','Croatia',0,4),('Colombia','Ivory Coast',2,1),('Uruguay','England',2,1),('Japan','Greece',0,0),('Italy','Costa Rica',0,1),('Switzerland','France',2,5),('Honduras','Ecuador',1,2),('Argentina','Iran',1,0),('Germany','Ghana',2,2),('Nigeria','Bosnia-Herzegovina',1,0),('Belgium','Russia',1,0),('South Korea','Algeria',2,4),('USA','Portugal',2,2),('Cameroon','Brazil',1,4),('Croatia','Mexico',1,3),('Australia','Spain',0,3),('Netherlands','Chile',2,0),('Japan','Colombia',1,4),('Costa Rica','England',0,0),('Italy','Uruguay',0,1),('Greece','Ivory Coast',2,1),('Honduras','Switzerland',0,3),('Ecuador','France',0,0),('Nigeria','Argentina',2,3),('Bosnia-Herzegovina','Iran',3,1),('USA','Germany',0,1),('Portugal','Ghana',2,1),('Algeria','Russia',1,1),('South Korea','Belgium',0,1)]
ELO_10 = {'Brazil':2136,'Spain':2128,'Netherlands':2095,'Germany':2070,'England':2065,'Argentina':2060,'Portugal':2040,'Italy':2035,'France':2020,'Uruguay':2005,'Chile':1995,'Serbia':1985,'Paraguay':1980,'United States':1975,'Mexico':1965,'Ivory Coast':1960,'Australia':1955,'Switzerland':1950,'Ghana':1945,'Denmark':1940,'South Korea':1935,'Greece':1930,'Japan':1925,'Cameroon':1920,'Nigeria':1915,'Slovakia':1910,'South Africa':1905,'Algeria':1895,'Slovenia':1890,'Honduras':1880,'New Zealand':1870,'North Korea':1850}
M10 = [('South Africa','Mexico',1,1),('Uruguay','France',0,0),('South Korea','Greece',2,0),('Argentina','Nigeria',1,0),('England','United States',1,1),('Algeria','Slovenia',0,1),('Serbia','Ghana',0,1),('Germany','Australia',4,0),('Netherlands','Denmark',2,0),('Japan','Cameroon',1,0),('Italy','Paraguay',1,1),('New Zealand','Slovakia',1,1),('Ivory Coast','Portugal',0,0),('Brazil','North Korea',2,1),('Honduras','Chile',0,1),('Spain','Switzerland',0,1),('South Africa','Uruguay',0,3),('Argentina','South Korea',4,1),('Greece','Nigeria',2,1),('France','Mexico',0,2),('Germany','Serbia',0,1),('Slovenia','United States',2,2),('England','Algeria',0,0),('Netherlands','Japan',1,0),('Ghana','Australia',1,1),('Cameroon','Denmark',1,2),('Slovakia','Paraguay',0,2),('Italy','New Zealand',1,1),('Brazil','Ivory Coast',3,1),('Portugal','North Korea',7,0),('Chile','Switzerland',1,0),('Spain','Honduras',2,0),('Mexico','Uruguay',0,1),('France','South Africa',1,2),('Nigeria','South Korea',2,2),('Greece','Argentina',0,2),('Slovenia','England',0,1),('United States','Algeria',1,0),('Ghana','Germany',0,1),('Australia','Serbia',2,1),('Paraguay','New Zealand',0,0),('Slovakia','Italy',3,2),('Denmark','Japan',1,3),('Cameroon','Netherlands',1,2),('North Korea','Ivory Coast',0,3),('Portugal','Brazil',0,0),('Chile','Spain',1,2),('Switzerland','Honduras',0,0)]

ALL = [
    ('WC2022', ELO_22, M22),
    ('WC2018', ELO_18, M18),
    ('WC2014', ELO_14, M14),
    ('WC2010', ELO_10, M10),
]

HOME_ADV = 40

def poisson(k, lam):
    if lam <= 0: lam = 0.05
    return math.exp(-lam)*(lam**k)/math.factorial(k)

def elo_prob(he, ae):
    diff = (he + HOME_ADV) - ae
    return 1/(1+math.pow(10,-diff/400))

def outcome_accuracy(probs, actual_hg, actual_ag):
    hw, dd, aw = probs
    if actual_hg > actual_ag: a = 'h'
    elif actual_hg == actual_ag: a = 'd'
    else: a = 'a'
    p = 'h' if hw>=dd and hw>=aw else ('d' if dd>=aw else 'a')
    return 1 if p == a else 0

def brier_score(probs, actual_hg, actual_ag):
    """Lower is better. Range 0-2."""
    hw, dd, aw = probs
    if actual_hg > actual_ag:
        return (1-hw/100)**2 + (0-dd/100)**2 + (0-aw/100)**2
    elif actual_hg == actual_ag:
        return (0-hw/100)**2 + (1-dd/100)**2 + (0-aw/100)**2
    else:
        return (0-hw/100)**2 + (0-dd/100)**2 + (1-aw/100)**2

def baseline_odds(he, ae):
    """Simulate odds from Elo (proxy for betting market)."""
    ph = elo_prob(he, ae)
    pa = 1 - ph
    oh = 1/ph if ph > 0.05 else 20
    oa = 1/pa if pa > 0.05 else 20
    # Remove margin
    hp = 1/oh; ap = 1/oa
    margin = (hp+ap+0.28-1)/3
    hc = max(0.02, hp-margin)
    ac = max(0.02, ap-margin)
    dc = max(0.02, 0.28-margin)
    total = hc+dc+ac
    return round(hc/total*100), round(dc/total*100), round(ac/total*100)

def model_elo_only(he, ae):
    """Elo only, no odds."""
    ph = elo_prob(he, ae)
    hw = round(ph*100)
    aw = round((1-ph)*100)
    dd = 100 - hw - aw
    return hw, dd, aw

def model_elo_recent(he, ae, hg_avg, ag_avg):
    """Elo + recent form (goals scored)."""
    hw, dd, aw = model_elo_only(he, ae)
    # Adjust towards recent form (10% weight)
    if hg_avg > 0 and ag_avg > 0:
        ratio = hg_avg/(hg_avg+ag_avg)
        hw = round(hw*0.9 + ratio*100*0.1)
        aw = round(aw*0.9 + (1-ratio)*100*0.1)
        dd = 100 - hw - aw
    return max(1,hw), max(1,dd), max(1,aw)

def evaluate_model(model_fn, matches, elo_db, recent_goals=None):
    """Evaluate a model on a set of matches."""
    total = 0
    correct = 0
    brier = 0
    for home, away, hg, ag in matches:
        he = elo_db.get(home, 1900)
        ae = elo_db.get(away, 1900)
        if recent_goals:
            hg_avg = recent_goals.get(home, 1.5)
            ag_avg = recent_goals.get(away, 1.2)
            probs = model_fn(he, ae, hg_avg, ag_avg)
        else:
            probs = model_fn(he, ae)
        correct += outcome_accuracy(probs, hg, ag)
        brier += brier_score(probs, hg, ag)
        total += 1
    return correct/total, brier/total

def main():
    print("═══ Dimension Validation Backtest (192 matches) ═══\n")
    print(f"{'Model':<35} {'Outcome':>8} {'Brier':>8} {'Gain':>8}")
    print("-" * 60)

    # Build all matches list
    all_matches = []
    all_elos = []
    for name, elo, matches in ALL:
        for h, a, hg, ag in matches:
            all_matches.append((h, a, hg, ag))
            all_elos.append(elo)

    # Baseline A: Elo-only (no odds)
    total = total_brier = 0
    recents = {}
    for name, elo, matches in ALL:
        for h, a, hg, ag in matches:
            he = elo.get(h, 1900); ae = elo.get(a, 1900)
            probs = model_elo_only(he, ae)
            total += outcome_accuracy(probs, hg, ag)
            total_brier += brier_score(probs, hg, ag)
    base_acc = total/192
    base_brier = total_brier/192
    print(f"{'A: Elo-only':<35} {base_acc*100:>7.1f}% {base_brier:>7.3f} {'':>8}")

    # Baseline B: Odds-only (simulated market)
    total = total_brier = 0
    for name, elo, matches in ALL:
        for h, a, hg, ag in matches:
            he = elo.get(h, 1900); ae = elo.get(a, 1900)
            probs = baseline_odds(he, ae)
            total += outcome_accuracy(probs, hg, ag)
            total_brier += brier_score(probs, hg, ag)
    odds_acc = total/192
    odds_brier = total_brier/192
    print(f"{'B: Odds-only (simulated market)':<35} {odds_acc*100:>7.1f}% {odds_brier:>7.3f} {'':>8}")

    # Baseline C: Odds + Elo blend (70/30)
    total = total_brier = 0
    for name, elo, matches in ALL:
        for h, a, hg, ag in matches:
            he = elo.get(h, 1900); ae = elo.get(a, 1900)
            oh, od, oa = baseline_odds(he, ae)
            eh, ed, ea = model_elo_only(he, ae)
            hw = round(oh*0.7 + eh*0.3)
            dw = round(od*0.7 + ed*0.3)
            aw = round(oa*0.7 + ea*0.3)
            probs = (hw, dw, aw)
            total += outcome_accuracy(probs, hg, ag)
            total_brier += brier_score(probs, hg, ag)
    blend_acc = total/192
    blend_brier = total_brier/192
    gain_acc = blend_acc - odds_acc
    gain_brier = odds_brier - blend_brier  # positive = improvement
    print(f"{'C: Odds+Elo (70/30)':<35} {blend_acc*100:>7.1f}% {blend_brier:>7.3f} {gain_acc*100:+5.1f}%")

    # Collect recent form data (goals scored avg from tournament)
    recent_goals = {}
    for name, elo, matches in ALL:
        team_goals = defaultdict(list)
        for h, a, hg, ag in matches:
            team_goals[h].append(hg)
            team_goals[a].append(ag)
        for team, goals in team_goals.items():
            recent_goals[team] = sum(goals)/len(goals)

    # Model D: + Recent form
    total = total_brier = 0
    for name, elo, matches in ALL:
        for h, a, hg, ag in matches:
            he = elo.get(h, 1900); ae = elo.get(a, 1900)
            oh, od, oa = baseline_odds(he, ae)
            hg_avg = recent_goals.get(h, 1.5)
            ag_avg = recent_goals.get(a, 1.2)
            eh, ed, ea = model_elo_recent(he, ae, hg_avg, ag_avg)
            hw = round(oh*0.65 + eh*0.35)
            dw = round(od*0.65 + ed*0.35)
            aw = round(oa*0.65 + ea*0.35)
            probs = (hw, dw, aw)
            total += outcome_accuracy(probs, hg, ag)
            total_brier += brier_score(probs, hg, ag)
    rec_acc = total/192; rec_brier = total_brier/192
    print(f"{'D: + Recent Form (35/65)':<35} {rec_acc*100:>7.1f}% {rec_brier:>7.3f} {(rec_acc-blend_acc)*100:+5.1f}%")

    print(f"\n── Summary ──")
    print(f"Best model: {'Odds+Elo' if blend_acc > rec_acc else 'Odds+Elo+RecentForm'}")
    print(f"Best outcome accuracy: {max(odds_acc, blend_acc, rec_acc)*100:.1f}%")
    print(f"Best Brier score: {min(odds_brier, blend_brier, rec_brier):.3f}")
    print(f"\nMarket comparison: Odds {odds_acc*100:.1f}% | Our best {(blend_acc if blend_acc>rec_acc else rec_acc)*100:.1f}%")
    print(f"Gain over market: {(max(blend_acc, rec_acc)-odds_acc)*100:+.1f}%")

    return 0

if __name__ == '__main__':
    main()
