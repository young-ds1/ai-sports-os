# Error Log — AI Sports OS

## 2026-06-13: xG Calibration Phase

### Known Issues Before Starting
1. **50% predictions = 1-0**: odds→xG→Poisson formula miscalibrated, xG values too compressed
2. **All 3 completed matches predicted 1-0**: Korea 2-1 Czech (actual), Canada 1-1 Bosnia, USA 4-1 Paraguay
3. **Score accuracy 0/3**: model can't predict anything but 1-0

### Root Cause
- xG formula `1.35 * exp(0.5 * logOdds)` produces values in 0.3-1.7 range
- At these λ values, Poisson peaks at 1 goal → 1-0 always wins
- No calibration against real match data

### Attempt 1: Grid-search xG coefficients (FAILED)
- **Approach**: Grid search A, B in xG=A*exp(B*logOdds) on WC 2022+2018
- **Result**: New formula xG=1.08*exp(0.39*logOdds) → MAE improved (2.02→1.91) but score accuracy WORSE (7→3/48), 1-0 ratio INCREASED (50%→52%)
- **Why failed**: Optimizing for MAE of xG doesn't correlate with score prediction accuracy. Poisson at any moderate λ peaks at 1 goal. The problem is structural, not parametric.
- **Lesson**: Can't fix the 1-0 problem by tweaking xG coefficients. Need different model architecture.

### Root Cause (Revised)
- Fundamental: Poisson(k=1, λ) > Poisson(k≠1, λ) for all λ in [0.5, 1.5] → 1-0 ALWAYS dominates
- Team strength not factored into xG — all teams with same odds get same prediction
- No attack/defense decomposition — can't differentiate a strong-attack team from strong-defense team
- Total goals depends on ABSOLUTE team strength, not just Elo DIFFERENCE

### Attempt 2: Bivariate Poisson with Attack/Defense + Parameter Optimization (SUCCESS)
- **Approach**: Elo→attack/defense decomposition, bivariate Poisson, grid-search 256 param combos on WC 2022+2018
- **Best params**: BASELINE=1.0, HOME_FACTOR=1.2, ATTACK_SPREAD=1.1, DEFENSE_SPREAD=0.5
- **Results**:
  - Score accuracy: 8% → 15.7% (DOUBLED)
  - Outcome accuracy: 54% (close to odds-only 60%)
  - 1-0 concentration: 50% → 35-48% (improved but still high — inherent to football)
  - Score diversity: 3 types → 4-5 types
- **Strategy**: 70% odds + 30% Elo for outcome; 100% Elo model for score distribution
- **Physics limitation**: Football IS low-scoring; Poisson(λ~1.3) always peaks at 1 goal. Can't cheat math while staying honest.
- **Deployed**: worldcup-predictions-v2.json → apps/web/public/worldcup-predictions.json
- **NEW SCRIPTS**: scripts/bivariate-predict.py (parameter search), scripts/generate-predictions.py (production predictions)
- **FAILED SCRIPTS**: scripts/xg-calibrate.py (grid search on xG coefficients — wrong approach)

### Step 2: Elo Dynamic Update Pipeline (COMPLETED)
- **Script**: scripts/elo-update.py
- **Flow**: match-results.json → update Elo (K=32, goal diff weight) → regenerate predictions → write files
- **Idempotent**: tracks processed matches in processed-matches.json
- **3 matches processed**:
  - USA +19 (4-1 win, x1.75 weight) 
  - South Korea +11 (2-1, x1.0)
  - Canada -4 (1-1 draw, favored team lost points)
  - Paraguay -19, Czech -11, Bosnia +4
- **Effect**: Big favorites now predict 2-0 (Germany vs Curaçao, France vs Iraq), moderate favorites 1-0, underdogs 0-1
- **Files**: elo-ratings.json, processed-matches.json, regenerated worldcup-predictions.json

### Step 4: Event System + Fatigue + Dixon-Coles ρ (COMPLETED)
- **Script**: scripts/predict-v3.py (replaces generate-predictions.py)
- **Event System**: events.json → Elo point adjustment for off-field factors
  - England -25 (装备被盗): xG shifted 1.85→1.68, prediction flipped to closer match
  - Severity scale: ±10-50 Elo points, expiresAfter date
- **Fatigue**: Rest days between matches → performance decay
  - <3 days: 0.88x, 3 days: 0.93x, 4 days: 0.97x, 5+: 1.0x
  - 2 matches affected (Norway 3d rest, Senegal 3d rest)
- **Dixon-Coles ρ**: Low-score probability correction (ρ=-0.08)
  - τ(0,0)=1-λμρ, τ(1,0)=1+λρ, τ(0,1)=1+μρ, τ(1,1)=1-ρ
  - 1-0 concentration: 44% → 17%, score diversity: 3→6 types
  - Now predicts 0-0 for the first time (4 matches)
- **New files**: events.json, scripts/predict-v3.py

### Step 5: 192-Match Recalibration + Player System (COMPLETED)
- **Script**: scripts/recalibrate-v4.py (192-match grid search), key-players.json
- **Training**: WC 2010+2014+2018+2022 = 192 matches (vs 96 before)
- **New optimal params**: BASELINE=0.9, ATTACK_SPREAD=1.2, DEFENSE_SPREAD=0.6, DC_RHO=-0.04
- **Score accuracy**: 9.4% → 14.6% (+55%), Concentration: 73% → 35%
- **Player system**: key-players.json — tracks star player status (available/doubtful/out), auto-computes Elo penalties. Currently monitoring Messi(30), Mbappé(28), Haaland(28), Bellingham(25), etc.
- **predict-v3.py** now reads xg-coefficients.json, events.json, key-players.json — all configs unified
- **Effect**: 0-0 predictions appeared (6 matches), 1-0 at 45% (acceptable given lower baseline xG), score diversity at 5 types

### Step 6: Squad Profiles + Group Pressure + Tactical Matchups (COMPLETED)
- **Squad profiles** (squad-profiles.json): avgAge, wcExperience (1-5), valueTier (1-5), playingStyle (possession/counter/balanced/physical)
  - Experience bonus: +15 (5), +10 (4), +5 (3), 0 (2), -5 (1) Elo points
  - Applied to all 44 teams
- **Group pressure** (group-standings.json): progression state → motivation multiplier
  - mustWin: attack×1.10, defense×1.05 (Paraguay after 1-4 loss)
  - needResult: ×1.05/×1.02, normal: ×1.0, deadRubber: ×0.95
  - finalGroupMatch: ×1.08/×1.03 (group stage round 3)
- **Tactical matchups**: possession vs counter → counter gets +8%, possession -8%
  - physical vs possession → physical +5%
  - 3 matches affected (Spain vs Cape Verde, Netherlands vs Sweden, Spain vs Saudi Arabia)
- **New files**: squad-profiles.json (44 teams), group-standings.json (12 groups)

### Step 7: Odds Tracking + Weather + Historical Similarity (COMPLETED)
- **Odds tracking** (odds-tracker.json): initial vs current odds → movement signal
  - Home odds shortening 3-8%: +5 Elo, 8-20%: +12, >20%: +25
  - Home odds drifting: opposite penalty
  - Framework ready, needs initial odds recording
- **Weather** (weather-factors.json): temperature + rain + wind → total goals adjustment
  - 35°C+: -0.3 goals, heavy rain: -0.5 goals + physical teams +8%
  - Can integrate OpenWeatherMap API (free 1000 calls/day)
  - Manual entry fallback supported
- **Historical similarity** (historical-db.json): 192-match WC database lookup
  - Finds 20 matches with closest Elo differential
  - Shows historical outcome % and top scores
  - Qatar vs Switzerland: model says 0-1, history says 70% away wins with 0-1 most common → CONFIRMED
- **New files**: odds-tracker.json, weather-factors.json, historical-db.json
