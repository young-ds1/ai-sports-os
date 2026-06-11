"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MonetizationAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonetizationAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
let MonetizationAnalyticsService = MonetizationAnalyticsService_1 = class MonetizationAnalyticsService {
    logger = new common_1.Logger(MonetizationAnalyticsService_1.name);
    signals = [];
    trackSignal(signal) {
        this.signals.push({ ...signal, timestamp: new Date() });
        this.logger.log(`[Monetization] ${signal.type} | user=${signal.userId.substring(0, 8)} | feature=${signal.feature || 'n/a'}`);
    }
    getDashboard() {
        const now = new Date();
        const daysAgo30 = new Date(now.getTime() - 30 * 86400000);
        const recentSignals = this.signals.filter(s => s.timestamp >= daysAgo30);
        const uniqueUsers = new Set(recentSignals.map(s => s.userId));
        const clicks = recentSignals.filter(s => s.type === 'upgrade_click').length;
        const previews = recentSignals.filter(s => s.type === 'feature_preview_click').length;
        const pricing = recentSignals.filter(s => s.type === 'pricing_view').length;
        const subs = recentSignals.filter(s => s.type === 'subscription_start').length;
        const predRequests = recentSignals.filter(s => s.feature === 'prediction' || s.feature === 'prediction').length;
        const tacticsRequests = recentSignals.filter(s => s.feature === 'tactics' || s.feature === 'tactics').length;
        // Premium intent: ratio of premium questions to total
        const total = recentSignals.length || 1;
        const premiumScore = Math.round(((predRequests + tacticsRequests) / total) * 100);
        // Top conversion source
        const sources = recentSignals
            .filter(s => s.type === 'upgrade_click' && s.source)
            .reduce((acc, s) => {
            acc[s.source] = (acc[s.source] || 0) + 1;
            return acc;
        }, {});
        const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
        const recommendations = [];
        if (premiumScore < 20)
            recommendations.push('提升 Pro 功能的可见性');
        if (clicks > 0 && subs / Math.max(clicks, 1) < 0.1)
            recommendations.push('优化升级流程，降低转化摩擦');
        if (previews > clicks * 2)
            recommendations.push('预览内容有吸引力但 CTA 不够突出');
        if (recommendations.length === 0)
            recommendations.push('商业化漏斗运行正常，持续监控');
        return {
            period: {
                start: daysAgo30.toISOString().split('T')[0],
                end: now.toISOString().split('T')[0],
            },
            funnel: {
                total_free_users: uniqueUsers.size,
                saw_preview: previews,
                clicked_upgrade: clicks,
                viewed_pricing: pricing,
                started_subscription: subs,
                conversion_rate: uniqueUsers.size > 0
                    ? Math.round((subs / uniqueUsers.size) * 10000) / 100
                    : 0,
            },
            revenue: {
                estimated_mrr: subs * 9.9,
                projected_arr: subs * 9.9 * 12,
                paying_users: subs,
                avg_revenue_per_user: uniqueUsers.size > 0
                    ? Math.round((subs * 9.9 / uniqueUsers.size) * 100) / 100
                    : 0,
            },
            signals: {
                prediction_requests: predRequests,
                tactics_requests: tacticsRequests,
                premium_intent_score: premiumScore,
                top_conversion_source: topSource,
            },
            recommendations,
        };
    }
};
exports.MonetizationAnalyticsService = MonetizationAnalyticsService;
exports.MonetizationAnalyticsService = MonetizationAnalyticsService = MonetizationAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)()
], MonetizationAnalyticsService);
//# sourceMappingURL=monetization-analytics.service.js.map