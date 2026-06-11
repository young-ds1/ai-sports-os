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
exports.MarketValidationController = void 0;
const common_1 = require("@nestjs/common");
const market_validation_service_1 = require("../../../../modules/users/market-validation.service");
const growth_dashboard_service_1 = require("../../../../modules/users/growth-dashboard.service");
const traffic_engine_service_1 = require("../../../../modules/users/traffic-engine.service");
const user_quality_service_1 = require("../../../../modules/users/user-quality.service");
const icp_validation_service_1 = require("../../../../modules/users/icp-validation.service");
const flywheel_design_service_1 = require("../../../../modules/users/flywheel-design.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let MarketValidationController = class MarketValidationController {
    mv;
    growth;
    traffic;
    quality;
    icp;
    flywheel;
    constructor(mv, growth, traffic, quality, icp, flywheel) {
        this.mv = mv;
        this.growth = growth;
        this.traffic = traffic;
        this.quality = quality;
        this.icp = icp;
        this.flywheel = flywheel;
    }
    async getFunnel(days = 7) {
        const report = await this.mv.getFunnel(days);
        const visitors = report.totalVisitors;
        report.stages.forEach(s => {
            s.overallRate = visitors > 0 ? Math.round((s.count / visitors) * 10000) / 100 : 0;
        });
        return report; // TransformInterceptor wraps in {data, meta}
    }
    async getRetention(cohort) {
        return await this.mv.getRetention(cohort);
    }
    async getPaymentFunnel() {
        return this.mv.getPaymentFunnel();
    }
    async trackPaymentEvent(body) {
        this.mv.trackPaymentEvent(body.userId, body.event, body.amount);
        return { status: 'ok' };
    }
    async getAttribution(days = 7) {
        return await this.mv.getContentAttribution(days);
    }
    async getNorthStarStatus() {
        return await this.mv.getNorthStarStatus();
    }
    async getWeeklyReport() {
        return await this.mv.getWeeklyReport();
    }
    // ── PHASE X-A: Growth Dashboard ──
    async getAcquisition(days = 7) {
        return await this.growth.getAcquisitionSnapshot(days);
    }
    async trackVisitor(body) {
        this.growth.trackVisitor(body);
        return { status: 'ok' };
    }
    async getContentPlan() {
        return this.growth.getDailyContentPlan();
    }
    async getMatchContent(matchId) {
        return this.growth.getContentForMatch(matchId);
    }
    async getSuccessMetrics() {
        return await this.growth.getSuccessMetrics();
    }
    // ── PHASE Y: Traffic Engine ──
    async getTrafficDashboard() {
        return await this.traffic.getAcquisitionDashboard();
    }
    async trackChannelVisit(body) {
        this.traffic.trackChannelVisit(body);
        return { status: 'ok' };
    }
    async getContentExperiments() {
        return this.traffic.getContentPerformance();
    }
    async trackShare(body) {
        this.traffic.trackShare(body.userId, body.platform);
        return { status: 'ok' };
    }
    async getVirality() {
        return this.traffic.getViralityMetrics();
    }
    async getScorecard() {
        return await this.traffic.getChannelScorecard();
    }
    async getKillList() {
        return this.traffic.getKillList();
    }
    async getScaleList() {
        return this.traffic.getScaleList();
    }
    async getAutoDecisions() {
        return this.traffic.getAutoDecisions();
    }
    async getTrafficWeeklyReport() {
        return await this.traffic.getWeeklyTrafficReport();
    }
    // ── PHASE Z: User Quality Validation ──
    async trackQualityAction(body) {
        this.quality.trackUserAction(body);
        return { status: 'ok' };
    }
    async getQualityDistribution() {
        return this.quality.getUserQualityDistribution();
    }
    async getChannelQuality() {
        return this.quality.getChannelQualityReport();
    }
    async getContentQuality() {
        return this.quality.getContentQualityReport();
    }
    async getShareLoop() {
        return this.quality.getShareLoopAnalysis();
    }
    async getQualityDecisions() {
        return this.quality.getQualityBasedDecisions();
    }
    async getQualityWeeklyReport() {
        return this.quality.getWeeklyQualityReport();
    }
    // ── PHASE AA: ICP Validation ──
    async segmentUser(body) {
        this.icp.segmentUser(body.userId, body.segment);
        return { status: 'ok' };
    }
    async trackICPAction(body) {
        this.icp.trackAction(body.userId, body);
        return { status: 'ok' };
    }
    async getSegments() {
        return this.icp.getSegmentProfiles();
    }
    async getBestFit() {
        return this.icp.getBestFitPerSegment();
    }
    async getICPWeeklyReport() {
        return this.icp.getICPWeeklyReport();
    }
    // ── PHASE AB: Flywheel Hypothesis Design ──
    // THIS IS NOT A MEASUREMENT ENDPOINT.
    // All values are hypothesis-only until validation gates are met.
    async getFlywheelHypothesis() {
        return this.flywheel.getHypothesisDocument();
    }
};
exports.MarketValidationController = MarketValidationController;
__decorate([
    (0, common_1.Get)('funnel'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getFunnel", null);
__decorate([
    (0, common_1.Get)('retention'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('cohort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getRetention", null);
__decorate([
    (0, common_1.Get)('payment-funnel'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getPaymentFunnel", null);
__decorate([
    (0, common_1.Post)('payment-event'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "trackPaymentEvent", null);
__decorate([
    (0, common_1.Get)('attribution'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getAttribution", null);
__decorate([
    (0, common_1.Get)('north-star-status'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getNorthStarStatus", null);
__decorate([
    (0, common_1.Get)('weekly-report'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getWeeklyReport", null);
__decorate([
    (0, common_1.Get)('growth/acquisition'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getAcquisition", null);
__decorate([
    (0, common_1.Post)('growth/track-visitor'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "trackVisitor", null);
__decorate([
    (0, common_1.Get)('growth/content-plan'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getContentPlan", null);
__decorate([
    (0, common_1.Get)('growth/content'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getMatchContent", null);
__decorate([
    (0, common_1.Get)('growth/success-metrics'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getSuccessMetrics", null);
__decorate([
    (0, common_1.Get)('traffic/dashboard'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getTrafficDashboard", null);
__decorate([
    (0, common_1.Post)('traffic/track-visit'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "trackChannelVisit", null);
__decorate([
    (0, common_1.Get)('traffic/content-experiments'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getContentExperiments", null);
__decorate([
    (0, common_1.Post)('traffic/share'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "trackShare", null);
__decorate([
    (0, common_1.Get)('traffic/virality'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getVirality", null);
__decorate([
    (0, common_1.Get)('traffic/scorecard'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getScorecard", null);
__decorate([
    (0, common_1.Get)('traffic/kill-list'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getKillList", null);
__decorate([
    (0, common_1.Get)('traffic/scale-list'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getScaleList", null);
__decorate([
    (0, common_1.Get)('traffic/auto-decisions'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getAutoDecisions", null);
__decorate([
    (0, common_1.Get)('traffic/weekly-report'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getTrafficWeeklyReport", null);
__decorate([
    (0, common_1.Post)('quality/track'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "trackQualityAction", null);
__decorate([
    (0, common_1.Get)('quality/distribution'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getQualityDistribution", null);
__decorate([
    (0, common_1.Get)('quality/channels'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getChannelQuality", null);
__decorate([
    (0, common_1.Get)('quality/content'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getContentQuality", null);
__decorate([
    (0, common_1.Get)('quality/share-loop'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getShareLoop", null);
__decorate([
    (0, common_1.Get)('quality/decisions'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getQualityDecisions", null);
__decorate([
    (0, common_1.Get)('quality/weekly-report'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getQualityWeeklyReport", null);
__decorate([
    (0, common_1.Post)('icp/segment'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "segmentUser", null);
__decorate([
    (0, common_1.Post)('icp/track'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "trackICPAction", null);
__decorate([
    (0, common_1.Get)('icp/segments'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getSegments", null);
__decorate([
    (0, common_1.Get)('icp/best-fit'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getBestFit", null);
__decorate([
    (0, common_1.Get)('icp/weekly-report'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getICPWeeklyReport", null);
__decorate([
    (0, common_1.Get)('flywheel/hypothesis'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketValidationController.prototype, "getFlywheelHypothesis", null);
exports.MarketValidationController = MarketValidationController = __decorate([
    (0, common_1.Controller)('api/admin'),
    __metadata("design:paramtypes", [market_validation_service_1.MarketValidationService,
        growth_dashboard_service_1.GrowthDashboardService,
        traffic_engine_service_1.TrafficEngineService,
        user_quality_service_1.UserQualityService,
        icp_validation_service_1.ICPValidationService,
        flywheel_design_service_1.FlywheelDesignService])
], MarketValidationController);
//# sourceMappingURL=market-validation.controller.js.map