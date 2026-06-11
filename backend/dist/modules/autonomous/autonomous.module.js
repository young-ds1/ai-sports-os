"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutonomousModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const domain_module_1 = require("../domain/domain.module");
const content_module_1 = require("../content/content.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const revenue_module_1 = require("../revenue/revenue.module");
const strategy_agent_service_1 = require("./agents/strategy-agent.service");
const content_agent_service_1 = require("./agents/content-agent.service");
const distribution_agent_service_1 = require("./agents/distribution-agent.service");
const growth_agent_service_1 = require("./agents/growth-agent.service");
const monetization_agent_service_1 = require("./agents/monetization-agent.service");
const autonomous_loop_service_1 = require("./autonomous-loop.service");
const autonomous_controller_1 = require("./autonomous.controller");
const AGENTS = [
    strategy_agent_service_1.StrategyAgentService, content_agent_service_1.ContentAgentService, distribution_agent_service_1.DistributionAgentService,
    growth_agent_service_1.GrowthAgentService, monetization_agent_service_1.MonetizationAgentService,
];
let AutonomousModule = class AutonomousModule {
};
exports.AutonomousModule = AutonomousModule;
exports.AutonomousModule = AutonomousModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            domain_module_1.DomainModule, content_module_1.ContentModule, subscriptions_module_1.SubscriptionsModule, revenue_module_1.RevenueModule,
        ],
        controllers: [autonomous_controller_1.AutonomousController],
        providers: [autonomous_loop_service_1.AutonomousLoopService, ...AGENTS],
        exports: [autonomous_loop_service_1.AutonomousLoopService],
    })
], AutonomousModule);
//# sourceMappingURL=autonomous.module.js.map