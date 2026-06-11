"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const domain_module_1 = require("../domain/domain.module");
const ai_engine_module_1 = require("../ai-engine/ai-engine.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const streak_tracker_service_1 = require("./streak-tracker.service");
const habit_loop_service_1 = require("./habit-loop.service");
const retention_engine_service_1 = require("./retention-engine.service");
const upgrade_path_service_1 = require("./upgrade-path.service");
const reengagement_service_1 = require("./reengagement.service");
const revenue_flywheel_service_1 = require("./revenue-flywheel.service");
const revenue_controller_1 = require("./revenue.controller");
const SERVICES = [
    streak_tracker_service_1.StreakTrackerService, habit_loop_service_1.HabitLoopService,
    retention_engine_service_1.RetentionEngineService, upgrade_path_service_1.UpgradePathService,
    reengagement_service_1.ReengagementService, revenue_flywheel_service_1.RevenueFlywheelService,
];
let RevenueModule = class RevenueModule {
};
exports.RevenueModule = RevenueModule;
exports.RevenueModule = RevenueModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), domain_module_1.DomainModule, ai_engine_module_1.AiEngineModule, subscriptions_module_1.SubscriptionsModule],
        controllers: [revenue_controller_1.RevenueController],
        providers: SERVICES,
        exports: SERVICES,
    })
], RevenueModule);
//# sourceMappingURL=revenue.module.js.map