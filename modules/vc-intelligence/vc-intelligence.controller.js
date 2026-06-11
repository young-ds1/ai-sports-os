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
exports.VCIntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const vc_dashboard_service_1 = require("./vc-dashboard.service");
const moat_metrics_service_1 = require("./moat-metrics.service");
const public_decorator_1 = require("../../shared/decorators/public.decorator");
let VCIntelligenceController = class VCIntelligenceController {
    vcDashboard;
    moatMetrics;
    constructor(vcDashboard, moatMetrics) {
        this.vcDashboard = vcDashboard;
        this.moatMetrics = moatMetrics;
    }
    /**
     * The single endpoint an investor opens.
     * Complete company snapshot — traction, revenue, moat, flywheel, narrative.
     */
    async getSnapshot() {
        return { data: await this.vcDashboard.getSnapshot() };
    }
    /**
     * Deep-dive: Moat strength analysis.
     */
    async getMoatAssessment() {
        const snapshot = await this.vcDashboard.getSnapshot();
        return { data: snapshot.moat };
    }
    /**
     * Deep-dive: Unit economics.
     */
    async getUnitEconomics() {
        const snapshot = await this.vcDashboard.getSnapshot();
        return { data: snapshot.unitEconomics };
    }
    /**
     * Deep-dive: Investment narrative (pitch-ready).
     */
    async getNarrative() {
        const snapshot = await this.vcDashboard.getSnapshot();
        return { data: snapshot.narrative };
    }
    /**
     * Traction summary — the numbers that matter.
     */
    async getTraction() {
        const snapshot = await this.vcDashboard.getSnapshot();
        return {
            data: {
                traction: snapshot.traction,
                revenue: snapshot.revenue,
                flywheel: snapshot.flywheel,
            },
        };
    }
};
exports.VCIntelligenceController = VCIntelligenceController;
__decorate([
    (0, common_1.Get)('snapshot'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VCIntelligenceController.prototype, "getSnapshot", null);
__decorate([
    (0, common_1.Get)('moat'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VCIntelligenceController.prototype, "getMoatAssessment", null);
__decorate([
    (0, common_1.Get)('economics'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VCIntelligenceController.prototype, "getUnitEconomics", null);
__decorate([
    (0, common_1.Get)('narrative'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VCIntelligenceController.prototype, "getNarrative", null);
__decorate([
    (0, common_1.Get)('traction'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VCIntelligenceController.prototype, "getTraction", null);
exports.VCIntelligenceController = VCIntelligenceController = __decorate([
    (0, common_1.Controller)('api/vc'),
    __metadata("design:paramtypes", [vc_dashboard_service_1.VCDashboardService,
        moat_metrics_service_1.MoatMetricsService])
], VCIntelligenceController);
//# sourceMappingURL=vc-intelligence.controller.js.map