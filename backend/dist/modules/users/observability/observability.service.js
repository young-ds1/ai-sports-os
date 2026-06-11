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
var ObservabilityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityService = void 0;
const common_1 = require("@nestjs/common");
const user_usage_service_1 = require("../user-usage.service");
const cost_tracker_service_1 = require("../../ai-engine/cost/cost-tracker.service");
let ObservabilityService = ObservabilityService_1 = class ObservabilityService {
    userUsageService;
    costTracker;
    logger = new common_1.Logger(ObservabilityService_1.name);
    rateLimitBreaches = 0;
    constructor(userUsageService, costTracker) {
        this.userUsageService = userUsageService;
        this.costTracker = costTracker;
    }
    /**
     * Generate a complete dashboard snapshot for the admin panel.
     */
    async getDashboardSnapshot(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const [dau, aiRequestsPerDau, topMatches] = await Promise.all([
            this.userUsageService.getDailyActiveUsers(targetDate),
            this.userUsageService.getAiRequestsPerDau(targetDate),
            this.userUsageService.getTopMatches(10, targetDate),
        ]);
        const cost = this.costTracker.getCostSummary();
        return {
            timestamp: new Date().toISOString(),
            metrics: {
                dau,
                ai_requests_per_dau: Math.round(aiRequestsPerDau * 100) / 100,
                total_ai_requests: Math.round(aiRequestsPerDau * dau),
                ai_analysis_ctr: null, // Calculated when match views are available
                estimated_daily_cost: cost.today_total,
                estimated_monthly_cost: cost.estimated_monthly,
            },
            top_matches: topMatches,
            usage_by_tier: {
                free: { users: dau, requests: 0 },
                vip: { users: 0, requests: 0 },
                pro: { users: 0, requests: 0 },
            },
            health: {
                cache_hit_rate: null,
                avg_latency_ms: null,
                cost_status: cost.today_total > 100 ? 'red' : cost.today_total > 50 ? 'yellow' : 'green',
                rate_limit_breaches: this.rateLimitBreaches,
            },
        };
    }
    /**
     * Track a rate limit breach for monitoring.
     */
    trackRateLimitBreach(userId, endpoint) {
        this.rateLimitBreaches++;
        this.logger.warn(`[RateLimit] Breach by user=${userId.substring(0, 8)} on ${endpoint}`);
    }
    /**
     * Log a user journey event for funnel analysis.
     */
    trackJourney(userId, step, metadata) {
        this.logger.log(`[Journey] user=${userId.substring(0, 8)} step=${step} ` +
            `${metadata ? JSON.stringify(metadata) : ''}`);
    }
};
exports.ObservabilityService = ObservabilityService;
exports.ObservabilityService = ObservabilityService = ObservabilityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_usage_service_1.UserUsageService,
        cost_tracker_service_1.CostTrackerService])
], ObservabilityService);
//# sourceMappingURL=observability.service.js.map