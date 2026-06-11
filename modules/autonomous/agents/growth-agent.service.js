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
var GrowthAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthAgentService = void 0;
const common_1 = require("@nestjs/common");
const growth_feedback_service_1 = require("../../content/feedback/growth-feedback.service");
const hook_optimizer_service_1 = require("../../content/factory/hook-optimizer.service");
const engagement_tracker_service_1 = require("../../content/feedback/engagement-tracker.service");
const revenue_flywheel_service_1 = require("../../revenue/revenue-flywheel.service");
let GrowthAgentService = GrowthAgentService_1 = class GrowthAgentService {
    growthFeedback;
    hookOptimizer;
    engagementTracker;
    flywheel;
    logger = new common_1.Logger(GrowthAgentService_1.name);
    previousMetrics = {};
    constructor(growthFeedback, hookOptimizer, engagementTracker, flywheel) {
        this.growthFeedback = growthFeedback;
        this.hookOptimizer = hookOptimizer;
        this.engagementTracker = engagementTracker;
        this.flywheel = flywheel;
    }
    /**
     * Analyze growth data and produce actionable recommendations.
     */
    async analyze(strategy, contentReport, distributionReport) {
        // Gather data
        const feedback = await this.growthFeedback.processFeedbackBatch(3);
        const dashboard = this.flywheel.getDashboard();
        const bestHooks = this.hookOptimizer.getBestPatterns(3);
        // Content performance
        const topHook = bestHooks[0];
        const contentPerformance = {
            topPlatform: feedback.topPerformers[0]?.platform || 'unknown',
            topHook: topHook?.pattern || 'unknown',
            avgCtr: feedback.topPerformers[0]?.ctr || 0,
            avgEngagement: feedback.topPerformers[0]?.engagement || 0,
        };
        // Conversion funnel
        const funnel = {
            impressions: distributionReport.totalPending + distributionReport.totalPublished,
            clicks: feedback.topPerformers.reduce((s, p) => s + (p.engagement || 0), 0),
            signups: dashboard.acquisition.newUsersToday,
            aiUsers: dashboard.retention.dau,
            payingUsers: dashboard.revenue.payingUsers,
            overallConversionRate: dashboard.revenue.paidConversionRate,
        };
        // Detect what's improving vs declining
        const whatImproved = [];
        const whatDeclined = [];
        const currentMetrics = {
            ctr: contentPerformance.avgCtr,
            engagement: contentPerformance.avgEngagement,
            dau: dashboard.retention.dau,
            conversion: dashboard.revenue.paidConversionRate,
            mrr: dashboard.revenue.estimatedMrr,
        };
        for (const [key, value] of Object.entries(currentMetrics)) {
            const prev = this.previousMetrics[key];
            if (prev !== undefined) {
                const change = ((value - prev) / Math.max(prev, 0.01)) * 100;
                if (change > 10)
                    whatImproved.push(`${key} +${Math.round(change)}%`);
                else if (change < -10)
                    whatDeclined.push(`${key} ${Math.round(change)}%`);
            }
        }
        this.previousMetrics = currentMetrics;
        // Recommendations
        const recommendations = [];
        if (contentPerformance.avgCtr < 0.03) {
            recommendations.push(`CTR 偏低 (${(contentPerformance.avgCtr * 100).toFixed(1)}%)。尝试更激进的 hook（当前最佳: ${topHook?.id}）`);
        }
        if (funnel.payingUsers === 0 && funnel.aiUsers > 10) {
            recommendations.push('有 AI 用户但无付费转化。强化 prediction preview 并在回答后立即展示 CTA');
        }
        if (whatDeclined.length > whatImproved.length) {
            recommendations.push('多个指标下滑。建议下一周期切换 primaryObjective 优先修复问题');
        }
        if (recommendations.length === 0) {
            recommendations.push('所有指标稳定或上升。扩大内容产出量，加速增长。');
        }
        // Priority action
        const priorityAction = dashboard.flywheel.bottleneck === 'acquisition'
            ? 'Increase content distribution volume on Twitter/X and 小红书'
            : dashboard.flywheel.bottleneck === 'conversion'
                ? 'Add prediction preview to all Free user analysis responses'
                : dashboard.flywheel.bottleneck === 'retention'
                    ? 'Activate daily AI digest push notifications'
                    : 'Scale content production — the flywheel is working';
        return {
            timestamp: new Date(),
            contentPerformance,
            conversionFunnel: funnel,
            whatImproved,
            whatDeclined,
            recommendations,
            priorityAction,
        };
    }
};
exports.GrowthAgentService = GrowthAgentService;
exports.GrowthAgentService = GrowthAgentService = GrowthAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [growth_feedback_service_1.GrowthFeedbackService,
        hook_optimizer_service_1.HookOptimizerService,
        engagement_tracker_service_1.EngagementTrackerService,
        revenue_flywheel_service_1.RevenueFlywheelService])
], GrowthAgentService);
//# sourceMappingURL=growth-agent.service.js.map