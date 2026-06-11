"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VCIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const revenue_module_1 = require("../revenue/revenue.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const content_module_1 = require("../content/content.module");
const autonomous_module_1 = require("../autonomous/autonomous.module");
const users_module_1 = require("../users/users.module");
const moat_metrics_service_1 = require("./moat-metrics.service");
const vc_dashboard_service_1 = require("./vc-dashboard.service");
const vc_intelligence_controller_1 = require("./vc-intelligence.controller");
let VCIntelligenceModule = class VCIntelligenceModule {
};
exports.VCIntelligenceModule = VCIntelligenceModule;
exports.VCIntelligenceModule = VCIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [revenue_module_1.RevenueModule, subscriptions_module_1.SubscriptionsModule, content_module_1.ContentModule, autonomous_module_1.AutonomousModule, users_module_1.UsersModule],
        controllers: [vc_intelligence_controller_1.VCIntelligenceController],
        providers: [moat_metrics_service_1.MoatMetricsService, vc_dashboard_service_1.VCDashboardService],
        exports: [vc_dashboard_service_1.VCDashboardService],
    })
], VCIntelligenceModule);
//# sourceMappingURL=vc-intelligence.module.js.map