"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StrategyAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyAgentService = void 0;
const common_1 = require("@nestjs/common");
const hot_score_service_1 = require("../../content/signals/hot-score.service");
const signal_ranker_service_1 = require("../../content/signals/signal-ranker.service");
const retention_engine_service_1 = require("../../revenue/retention-engine.service");
const revenue_flywheel_service_1 = require("../../revenue/revenue-flywheel.service");
const matches_service_1 = require("../../domain/matches/matches.service");
let StrategyAgentService = StrategyAgentService_1 = class StrategyAgentService {
    hotScore;
    signalRanker;
    retention;
    flywheel;
    matchesService;
    logger = new common_1.Logger(StrategyAgentService_1.name);
    cycleCount = 0;
    decisionLog = [];
    constructor(hotScore, signalRanker, retention, flywheel, matchesService) {
        this.hotScore = hotScore;
        this.signalRanker = signalRanker;
        this.retention = retention;
        this.flywheel = flywheel;
        this.matchesService = matchesService;
    }
    /**
     * Decide: what should the system do this cycle?
     */
    async decide() {
        this.cycleCount++;
        const now = new Date();
        // Gather intelligence
        const dashboard = this.flywheel.getDashboard();
        const todayMatches = await this.matchesService.findTodayMatches();
        const retentionOverview = this.retention.getOverview();
        const churnRisks = this.retention.getChurnRiskUsers(5);
        // ── Determine primary objective ──
        let primaryObjective;
        let reasoning;
        if (dashboard.flywheel.bottleneck === 'acquisition' && dashboard.retention.dau < 50) {
            primaryObjective = 'grow_dau';
            reasoning = `DAU=${dashboard.retention.dau} < 50 且获客是瓶颈。优先增加内容分发量。`;
        }
        else if (dashboard.flywheel.bottleneck === 'retention' && (dashboard.retention.d7 || 0) < 20) {
            primaryObjective = 'increase_engagement';
            reasoning = `D7留存=${dashboard.retention.d7}% < 20%。优先养成使用习惯。`;
        }
        else if (dashboard.flywheel.bottleneck === 'conversion' && dashboard.revenue.paidConversionRate < 2) {
            primaryObjective = 'increase_conversion';
            reasoning = `付费转化率=${dashboard.revenue.paidConversionRate}% < 2%。优先强化决策价值定位。`;
        }
        else if (dashboard.flywheel.bottleneck === 'churn') {
            primaryObjective = 'reduce_churn';
            reasoning = `流失风险用户=${dashboard.retention.churnRiskCount}。优先挽回。`;
        }
        else {
            primaryObjective = 'optimize_pricing';
            reasoning = '核心指标健康。优化定价最大化 MRR。';
        }
        // ── Match selection ──
        const matchScores = todayMatches.map(m => ({
            matchId: m.id,
            score: this.quickScore(m),
        })).sort((a, b) => b.score - a.score);
        const topN = primaryObjective === 'grow_dau'
            ? Math.min(5, matchScores.length) // Push more content for growth
            : Math.min(3, matchScores.length); // Normal mode
        const topMatchIds = matchScores.slice(0, topN).map(m => m.matchId);
        // ── Content plan ──
        const hasHighScoring = matchScores[0]?.score >= 60;
        const contentPlan = {
            primaryContentType: hasHighScoring ? 'hot_take' : 'post_match',
            platforms: primaryObjective === 'grow_dau'
                ? ['xiaohongshu', 'twitter', 'douyin', 'wechat', 'seo'] // All platforms for growth
                : ['twitter', 'xiaohongshu', 'seo'], // Focused for efficiency
            hooksToUse: hasHighScoring ? ['numbers-first', 'thread-tease'] : ['data-drop', 'hot-take'],
            contentPiecesTarget: topN * (primaryObjective === 'grow_dau' ? 5 : 3), // N matches × platforms
        };
        // ── Growth directive ──
        const flywheel = dashboard.flywheel;
        const growthDirective = {
            focusChannel: flywheel.bottleneck === 'acquisition' ? 'twitter'
                : flywheel.bottleneck === 'conversion' ? 'wechat'
                    : 'xiaohongshu',
            budgetRecommendation: flywheel.health === 'accelerating' ? 'increase'
                : flywheel.health === 'healthy' ? 'maintain'
                    : 'increase',
        };
        // ── Bottleneck assessment ──
        const hasChurnRisks = churnRisks.length > 3;
        const bottleneck = {
            current: flywheel.bottleneck,
            severity: (flywheel.health === 'critical' ? 'critical'
                : flywheel.health === 'building' ? 'high'
                    : hasChurnRisks ? 'medium'
                        : 'low'),
            suggestedFix: dashboard.flywheel.recommendation,
        };
        // ── Confidence ──
        const confidenceScore = this.calculateConfidence({
            matchCount: todayMatches.length,
            dau: dashboard.retention.dau,
            hasChurnData: churnRisks.length > 0,
            hasRevenueData: dashboard.revenue.payingUsers > 0,
            cycleCount: this.cycleCount,
        });
        const decision = {
            timestamp: now,
            cycle: this.cycleCount,
            primaryObjective,
            reasoning,
            matchCoverage: {
                totalMatchesToday: todayMatches.length,
                selectedForContent: topMatchIds.length,
                topMatchIds,
                selectionCriteria: `Top ${topN} by hot score (threshold: ${hasHighScoring ? '≥60' : 'any'})`,
            },
            contentPlan,
            growthDirective,
            bottleneck,
            confidenceScore,
        };
        this.decisionLog.push(decision);
        this.logger.log(`[StrategyAgent] Cycle #${this.cycleCount} | Objective: ${primaryObjective} | ` +
            `Covering ${topMatchIds.length}/${todayMatches.length} matches | ` +
            `Confidence: ${confidenceScore}% | Bottleneck: ${bottleneck.current} (${bottleneck.severity})`);
        return decision;
    }
    /**
     * Quick match score without full HotScoreInput (for autonomous decision speed).
     */
    quickScore(match) {
        let score = 20;
        if (match.status === 'live')
            score += 30;
        if (match.status === 'finished')
            score += 15;
        const goals = (match.home_score || 0) + (match.away_score || 0);
        if (goals >= 5)
            score += 30;
        else if (goals >= 3)
            score += 20;
        else if (goals > 0)
            score += 10;
        if (match.group_name)
            score += 5;
        return score;
    }
    calculateConfidence(ctx) {
        let confidence = 50; // Base
        if (ctx.matchCount > 0)
            confidence += 15;
        if (ctx.dau > 10)
            confidence += 10;
        if (ctx.hasChurnData)
            confidence += 10;
        if (ctx.hasRevenueData)
            confidence += 10;
        if (ctx.cycleCount > 10)
            confidence += 5; // More cycles = more learning
        return Math.min(100, confidence);
    }
    getDecisionLog(limit = 10) {
        return this.decisionLog.slice(-limit).reverse();
    }
};
exports.StrategyAgentService = StrategyAgentService;
exports.StrategyAgentService = StrategyAgentService = StrategyAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hot_score_service_1.HotScoreService,
        signal_ranker_service_1.SignalRankerService,
        retention_engine_service_1.RetentionEngineService,
        revenue_flywheel_service_1.RevenueFlywheelService,
        matches_service_1.MatchesService])
], StrategyAgentService);
//# sourceMappingURL=strategy-agent.service.js.map