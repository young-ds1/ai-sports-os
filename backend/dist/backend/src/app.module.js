"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const infrastructure_module_1 = require("../../infrastructure/infrastructure.module");
const domain_module_1 = require("../../modules/domain/domain.module");
const ingestion_module_1 = require("../../modules/ingestion/ingestion.module");
const ai_engine_module_1 = require("../../modules/ai-engine/ai-engine.module");
const users_module_1 = require("../../modules/users/users.module");
const content_module_1 = require("../../modules/content/content.module");
const subscriptions_module_1 = require("../../modules/subscriptions/subscriptions.module");
const revenue_module_1 = require("../../modules/revenue/revenue.module");
const autonomous_module_1 = require("../../modules/autonomous/autonomous.module");
const vc_intelligence_module_1 = require("../../modules/vc-intelligence/vc-intelligence.module");
const api_module_1 = require("./api/api.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            infrastructure_module_1.InfrastructureModule,
            domain_module_1.DomainModule,
            ingestion_module_1.IngestionModule,
            ai_engine_module_1.AiEngineModule,
            users_module_1.UsersModule,
            content_module_1.ContentModule, // Growth & Content Engine (STEP 7-8)
            subscriptions_module_1.SubscriptionsModule, // Monetization (STEP 9-10)
            revenue_module_1.RevenueModule, // Retention & Revenue Flywheel (STEP 11)
            autonomous_module_1.AutonomousModule, // Autonomous AI Sports Company (STEP 12)
            vc_intelligence_module_1.VCIntelligenceModule, // VC-Ready System Spec (STEP 13)
            api_module_1.ApiModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map