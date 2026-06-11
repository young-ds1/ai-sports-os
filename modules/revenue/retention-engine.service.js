"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RetentionEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetentionEngineService = void 0;
const common_1 = require("@nestjs/common");
let RetentionEngineService = RetentionEngineService_1 = class RetentionEngineService {
    logger = new common_1.Logger(RetentionEngineService_1.name);
    users = new Map();
    dailyActiveUsers = new Map();
    /**
     * Record a user session. Call on any page view or AI action.
     */
    recordSession(userId, tier, action) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        // Track daily active
        if (!this.dailyActiveUsers.has(today)) {
            this.dailyActiveUsers.set(today, new Set());
        }
        this.dailyActiveUsers.get(today).add(userId);
        // Update user activity
        let user = this.users.get(userId);
        if (!user) {
            user = {
                userId, firstSeen: now, lastSeen: now,
                activeDates: new Set(), tier, aiActions: 0,
            };
        }
        user.lastSeen = now;
        user.activeDates.add(today);
        user.tier = tier;
        if (action?.startsWith('ai_'))
            user.aiActions++;
        this.users.set(userId, user);
    }
    /**
     * Get DAU count.
     */
    getDau(date) {
        const key = date || new Date().toISOString().split('T')[0];
        return this.dailyActiveUsers.get(key)?.size || 0;
    }
    /**
     * Calculate cohort retention.
     */
    getCohortRetention(cohortDate) {
        const cohort = cohortDate || new Date().toISOString().split('T')[0];
        const cohortUsers = Array.from(this.users.values())
            .filter(u => u.firstSeen.toISOString().split('T')[0] === cohort);
        if (cohortUsers.length === 0) {
            return { cohort, size: 0, d1: 0, d7: 0, d30: 0, avgActionsPerUser: 0 };
        }
        const daysAfter = (n) => {
            const d = new Date(cohort);
            d.setDate(d.getDate() + n);
            return d.toISOString().split('T')[0];
        };
        const d1Active = cohortUsers.filter(u => u.activeDates.has(daysAfter(1))).length;
        const d7Active = cohortUsers.filter(u => u.activeDates.has(daysAfter(7))).length;
        const d30Active = cohortUsers.filter(u => u.activeDates.has(daysAfter(30))).length;
        const totalActions = cohortUsers.reduce((sum, u) => sum + u.aiActions, 0);
        return {
            cohort,
            size: cohortUsers.length,
            d1: Math.round((d1Active / cohortUsers.length) * 100),
            d7: Math.round((d7Active / cohortUsers.length) * 100),
            d30: Math.round((d30Active / cohortUsers.length) * 100),
            avgActionsPerUser: Math.round(totalActions / cohortUsers.length),
        };
    }
    /**
     * Identify users at risk of churning.
     */
    getChurnRiskUsers(limit = 20) {
        const today = new Date().toISOString().split('T')[0];
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const atRisk = [];
        for (const user of this.users.values()) {
            const riskFactors = [];
            let riskScore = 0;
            // Factor 1: Inactive for 3+ days
            if (user.lastSeen.toISOString().split('T')[0] < threeDaysAgo) {
                riskScore += 40;
                riskFactors.push('3天未活跃');
            }
            // Factor 2: Was active 7 days ago but not recently
            if (user.activeDates.has(sevenDaysAgo) && user.lastSeen.toISOString().split('T')[0] < threeDaysAgo) {
                riskScore += 30;
                riskFactors.push('活跃度下降');
            }
            // Factor 3: Free tier with high usage → upgrade friction
            if (user.tier === 'free' && user.aiActions > 10) {
                riskScore += 20;
                riskFactors.push('免费高频用户可能遇到限制瓶颈');
            }
            // Factor 4: Pro tier but low recent usage
            if ((user.tier === 'vip' || user.tier === 'pro') && user.lastSeen.toISOString().split('T')[0] < threeDaysAgo) {
                riskScore += 50;
                riskFactors.push('付费用户即将流失');
            }
            if (riskScore >= 30) {
                atRisk.push({
                    userId: user.userId,
                    riskScore: Math.min(100, riskScore),
                    riskFactors,
                    lastActive: user.lastSeen.toISOString().split('T')[0],
                    tier: user.tier,
                    recommendedAction: this.recommendAction(riskScore, user.tier),
                });
            }
        }
        return atRisk.sort((a, b) => b.riskScore - a.riskScore).slice(0, limit);
    }
    /**
     * Get retention overview dashboard.
     */
    getOverview() {
        const churnRisks = this.getChurnRiskUsers(1000);
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const thirtyDaysAgoDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const cohort7 = this.getCohortRetention(sevenDaysAgo);
        const cohort30 = this.getCohortRetention(thirtyDaysAgoDate);
        const totalUsers = this.users.size;
        const healthyUsers = totalUsers - churnRisks.length;
        return {
            dau: this.getDau(today),
            d7Retention: cohort7.size > 0 ? cohort7.d7 : null,
            d30Retention: cohort30.size > 0 ? cohort30.d30 : null,
            totalTrackedUsers: totalUsers,
            churnRiskCount: churnRisks.length,
            healthyPercent: totalUsers > 0 ? Math.round((healthyUsers / totalUsers) * 100) : 100,
        };
    }
    recommendAction(riskScore, tier) {
        if (tier === 'vip' || tier === 'pro') {
            return riskScore >= 70 ? '发送个性化挽回邮件 + 优惠券' : '推送"你的AI分析周报已生成"通知';
        }
        return riskScore >= 50 ? '推送"今日比赛 AI 预测"吸引回归' : '展示连续使用天数奖励';
    }
};
exports.RetentionEngineService = RetentionEngineService;
exports.RetentionEngineService = RetentionEngineService = RetentionEngineService_1 = __decorate([
    (0, common_1.Injectable)()
], RetentionEngineService);
//# sourceMappingURL=retention-engine.service.js.map