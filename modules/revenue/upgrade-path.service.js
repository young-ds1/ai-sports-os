"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpgradePathService = void 0;
const common_1 = require("@nestjs/common");
let UpgradePathService = class UpgradePathService {
    /**
     * Evaluate a user's upgrade readiness across all paths.
     */
    evaluate(userId, context) {
        if (context.tier === 'pro') {
            return {
                userId, currentTier: 'pro',
                paths: [], recommendedNextTier: null, urgencyLevel: 'none',
            };
        }
        const paths = [
            this.evaluateLimitWall(context),
            this.evaluateInsightGap(context),
            this.evaluateDecisionNeed(context),
        ].filter(Boolean);
        const triggered = paths.filter(p => p.triggered);
        const urgency = triggered.length >= 2 ? 'high'
            : triggered.length === 1 ? 'medium'
                : paths.some(p => p.progress >= 50) ? 'low'
                    : 'none';
        return {
            userId,
            currentTier: context.tier,
            paths,
            recommendedNextTier: triggered.length > 0
                ? (context.tier === 'free' ? 'pro' : 'elite')
                : null,
            urgencyLevel: urgency,
        };
    }
    evaluateLimitWall(ctx) {
        const progress = Math.min(100, Math.round((ctx.todayAnalysisCount / ctx.dailyLimit) * 100));
        return {
            id: 'limit_wall',
            name: '用量限制',
            description: `今日已用 ${ctx.todayAnalysisCount}/${ctx.dailyLimit} 次分析`,
            progress,
            triggered: ctx.todayAnalysisCount >= ctx.dailyLimit,
            triggerReason: ctx.todayAnalysisCount >= ctx.dailyLimit
                ? '今日分析次数已用完。升级 Pro 畅享 50 次/天。'
                : `还差 ${ctx.dailyLimit - ctx.todayAnalysisCount} 次触达上限`,
            nextTier: 'pro',
        };
    }
    evaluateInsightGap(ctx) {
        const progress = ctx.consecutiveQuestions >= 3 ? 100
            : ctx.consecutiveQuestions >= 2 ? 66
                : ctx.consecutiveQuestions >= 1 ? 33 : 0;
        return {
            id: 'insight_gap',
            name: '深度需求',
            description: `已连续提问 ${ctx.consecutiveQuestions} 次`,
            progress,
            triggered: ctx.consecutiveQuestions >= 3 && ctx.hasAskedPrediction,
            triggerReason: '你追问了很多深度问题。Pro 解锁战术拆解 + 球员评分。',
            nextTier: 'pro',
        };
    }
    evaluateDecisionNeed(ctx) {
        const progress = ctx.hasAskedPrediction ? 80 : ctx.hasViewedKeyMatch ? 50 : ctx.streak >= 3 ? 30 : 0;
        return {
            id: 'decision_need',
            name: '决策需求',
            description: ctx.hasAskedPrediction ? '已询问预测类问题' : '持续关注比赛',
            progress,
            triggered: ctx.hasAskedPrediction && ctx.streak >= 3,
            triggerReason: '你关注关键比赛且需要预测。Pro 帮你做判断，不只是看数据。',
            nextTier: 'pro',
        };
    }
};
exports.UpgradePathService = UpgradePathService;
exports.UpgradePathService = UpgradePathService = __decorate([
    (0, common_1.Injectable)()
], UpgradePathService);
//# sourceMappingURL=upgrade-path.service.js.map