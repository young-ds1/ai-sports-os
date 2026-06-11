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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const distribution_service_1 = require("../distribution/distribution.service");
const engagement_tracker_service_1 = require("./engagement-tracker.service");
const user_usage_service_1 = require("../../users/user-usage.service");
let GrowthAnalyticsService = class GrowthAnalyticsService {
    distributionService;
    engagementTracker;
    userUsageService;
    constructor(distributionService, engagementTracker, userUsageService) {
        this.distributionService = distributionService;
        this.engagementTracker = engagementTracker;
        this.userUsageService = userUsageService;
    }
    /**
     * Generate a complete growth dashboard.
     */
    async getGrowthDashboard(days = 7) {
        const performance = await this.distributionService.getContentPerformance(days);
        const attribution = this.engagementTracker.getAttributionReport(days);
        const dau = await this.userUsageService.getDailyActiveUsers();
        const aiPerDau = await this.userUsageService.getAiRequestsPerDau();
        // Calculate total clicks from engagement data
        let totalClicks = 0;
        let totalConversions = 0;
        for (const [, data] of Object.entries(attribution.by_platform)) {
            totalClicks += data.clicks || 0;
            totalConversions += data.conversions || 0;
        }
        // Growth recommendation engine
        const recommendation = this.generateRecommendation({
            publishRate: performance.total_outputs > 0
                ? performance.published / performance.total_outputs
                : 0,
            aiPerDau,
            conversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
            days,
        });
        return {
            period: {
                start: new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
            },
            content: {
                total_generated: performance.total_outputs,
                total_published: performance.published,
                publish_rate: performance.total_outputs > 0
                    ? Math.round((performance.published / performance.total_outputs) * 100)
                    : 0,
                by_platform: performance.by_platform,
            },
            traffic: {
                estimated_clicks: totalClicks,
                estimated_conversions: totalConversions,
                conversion_rate: totalClicks > 0
                    ? Math.round((totalConversions / totalClicks) * 10000) / 100
                    : 0,
            },
            growth: {
                new_users: 0, // Phase 3: track via user.created_at
                returning_users: dau,
                dau_trend: 'flat',
                ai_requests_per_dau: Math.round(aiPerDau * 100) / 100,
            },
            recommendation,
        };
    }
    generateRecommendation(metrics) {
        const issues = [];
        if (metrics.publishRate < 0.5) {
            issues.push('内容发布率偏低，建议增加分发频率或自动化发布');
        }
        if (metrics.aiPerDau < 0.5) {
            issues.push('AI 使用率未达标，优化内容中的 CTA 引导用户尝试 AI 分析');
        }
        if (metrics.conversionRate < 0.02 && metrics.days > 7) {
            issues.push('转化率低，检查落地页体验和 UTM 追踪准确性');
        }
        if (issues.length === 0) {
            return '增长系统运行正常。继续扩大内容产出量，测试新的内容类型。';
        }
        return issues.join('；');
    }
};
exports.GrowthAnalyticsService = GrowthAnalyticsService;
exports.GrowthAnalyticsService = GrowthAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [distribution_service_1.DistributionService,
        engagement_tracker_service_1.EngagementTrackerService,
        user_usage_service_1.UserUsageService])
], GrowthAnalyticsService);
//# sourceMappingURL=growth-analytics.service.js.map