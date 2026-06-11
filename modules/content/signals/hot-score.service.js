"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotScoreService = void 0;
const common_1 = require("@nestjs/common");
const STAR_TIER_WEIGHT = {
    goat: 25,
    superstar: 15,
    star: 8,
    notable: 3,
};
const STAGE_WEIGHT = {
    final: 50,
    semi: 40,
    quarter: 30,
    round_of_16: 20,
    group: 10,
    friendly: 2,
};
let HotScoreService = class HotScoreService {
    /**
     * Calculate hotness score for a match signal.
     * Formula: importance(30%) + starPower(25%) + momentum(25%) + buzz(20%)
     */
    calculate(input) {
        const importance = this.scoreImportance(input);
        const starPower = this.scoreStarPower(input);
        const momentum = this.scoreMomentum(input);
        const buzz = this.scoreBuzz(input);
        const total = Math.round(importance * 0.30 + starPower * 0.25 + momentum * 0.25 + buzz * 0.20);
        const tier = total >= 80 ? 'nuclear' :
            total >= 55 ? 'hot' :
                total >= 30 ? 'warm' : 'cold';
        return {
            matchId: input.matchId,
            totalScore: total,
            importanceScore: importance,
            starPowerScore: starPower,
            momentumScore: momentum,
            buzzScore: buzz,
            isExplosive: tier === 'nuclear' || tier === 'hot',
            tier,
            reason: this.buildReason(input, { importance, starPower, momentum, buzz }),
        };
    }
    scoreImportance(input) {
        let score = 0;
        // Tournament stage (max 50)
        const stageKey = Object.keys(STAGE_WEIGHT).find(k => input.tournamentStage?.includes(k));
        score += STAGE_WEIGHT[stageKey || 'group'];
        // Rivalry bonus (derby matches)
        const rivalries = [
            ['Argentina', 'Brazil'], ['Germany', 'Netherlands'],
            ['England', 'France'], ['Spain', 'Portugal'],
            ['Argentina', 'England'], ['Brazil', 'France'],
        ];
        const isRivalry = rivalries.some(([a, b]) => (input.homeTeam === a && input.awayTeam === b) ||
            (input.homeTeam === b && input.awayTeam === a));
        if (isRivalry)
            score += 25;
        // Knockout/final stakes
        if (input.tournamentStage === 'semi')
            score += 15;
        if (input.tournamentStage === 'final')
            score += 25;
        return Math.min(100, score);
    }
    scoreStarPower(input) {
        if (!input.starPlayers || input.starPlayers.length === 0)
            return 10;
        const raw = input.starPlayers.reduce((sum, p) => sum + (STAR_TIER_WEIGHT[p.tier] || 3), 0);
        // Cap at 100, but give bonus for multiple stars
        return Math.min(100, raw + (input.starPlayers.length > 2 ? 15 : 0));
    }
    scoreMomentum(input) {
        if (input.status === 'scheduled')
            return 15; // Pre-match — moderate
        let score = 20; // Base for being live/finished
        // Goals = momentum
        const goals = input.totalGoals || (input.homeScore || 0) + (input.awayScore || 0);
        score += goals * 5;
        // Close games are more exciting
        const diff = input.goalDiff ?? Math.abs((input.homeScore || 0) - (input.awayScore || 0));
        if (diff === 0)
            score += 20; // Draw = tension
        if (diff === 1)
            score += 25; // 1-goal game = peak drama
        if (diff >= 3)
            score -= 10; // Blowout = less interesting (unless comeback)
        // Drama multipliers
        if (input.hasComeback)
            score += 30;
        if (input.hasRedCard)
            score += 15;
        if (input.isExtraTime)
            score += 20;
        if (input.isPenaltyShootout)
            score += 35;
        if (input.lateDramaMinutes && input.lateDramaMinutes >= 85)
            score += 25;
        if (input.lateDramaMinutes && input.lateDramaMinutes >= 90)
            score += 35;
        return Math.min(100, score);
    }
    scoreBuzz(input) {
        let score = 10; // Base
        // External mention volume
        if (input.externalMentions) {
            if (input.externalMentions > 100000)
                score += 40;
            else if (input.externalMentions > 50000)
                score += 30;
            else if (input.externalMentions > 10000)
                score += 20;
            else if (input.externalMentions > 1000)
                score += 10;
        }
        // Trending position
        if (input.trendPosition) {
            if (input.trendPosition <= 3)
                score += 35;
            else if (input.trendPosition <= 10)
                score += 20;
            else if (input.trendPosition <= 50)
                score += 10;
        }
        // World Cup inherently has buzz
        if (input.competition?.includes('World Cup'))
            score += 15;
        return Math.min(100, score);
    }
    buildReason(input, scores) {
        const reasons = [];
        if (scores.importance >= 60)
            reasons.push('高关注度赛事阶段');
        if (scores.starPower >= 50)
            reasons.push('顶级球星出场');
        if (scores.momentum >= 60)
            reasons.push('比赛戏剧性极高');
        if (scores.buzz >= 40)
            reasons.push('社交媒体热议');
        // Specific drama hooks
        if (input.hasComeback)
            reasons.push('惊天逆转');
        if (input.hasRedCard)
            reasons.push('红牌改变局势');
        if (input.isPenaltyShootout)
            reasons.push('点球大战');
        const totalGoals = (input.homeScore || 0) + (input.awayScore || 0);
        if (totalGoals >= 5)
            reasons.push(`${totalGoals}球进球大战`);
        if (input.lateDramaMinutes && input.lateDramaMinutes >= 90)
            reasons.push('补时绝杀/绝平');
        return reasons.join(' · ') || '常规赛事';
    }
};
exports.HotScoreService = HotScoreService;
exports.HotScoreService = HotScoreService = __decorate([
    (0, common_1.Injectable)()
], HotScoreService);
//# sourceMappingURL=hot-score.service.js.map