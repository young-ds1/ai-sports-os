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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const observability_service_1 = require("../../../../modules/users/observability/observability.service");
const cost_tracker_service_1 = require("../../../../modules/ai-engine/cost/cost-tracker.service");
const user_usage_service_1 = require("../../../../modules/users/user-usage.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let AnalyticsController = class AnalyticsController {
    observability;
    costTracker;
    userUsageService;
    constructor(observability, costTracker, userUsageService) {
        this.observability = observability;
        this.costTracker = costTracker;
        this.userUsageService = userUsageService;
    }
    async getDashboard(date) {
        return this.observability.getDashboardSnapshot(date);
    }
    async getCosts() {
        return this.costTracker.getCostSummary();
    }
    async getNorthStarMetric(days = 7) {
        const results = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const ratio = await this.userUsageService.getAiRequestsPerDau(dateStr);
            const dau = await this.userUsageService.getDailyActiveUsers(dateStr);
            results.push({ date: dateStr, ai_requests_per_dau: Math.round(ratio * 100) / 100, dau });
        }
        return { data: results };
    }
    async getTopMatches(date, limit = 10) {
        return this.userUsageService.getTopMatches(limit, date);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('costs'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCosts", null);
__decorate([
    (0, common_1.Get)('north-star'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getNorthStarMetric", null);
__decorate([
    (0, common_1.Get)('top-matches'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopMatches", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('api/admin/analytics'),
    __metadata("design:paramtypes", [observability_service_1.ObservabilityService,
        cost_tracker_service_1.CostTrackerService,
        user_usage_service_1.UserUsageService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map