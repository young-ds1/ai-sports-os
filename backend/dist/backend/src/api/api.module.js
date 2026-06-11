"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const domain_module_1 = require("../../../modules/domain/domain.module");
const ai_engine_module_1 = require("../../../modules/ai-engine/ai-engine.module");
const users_module_1 = require("../../../modules/users/users.module");
const subscriptions_module_1 = require("../../../modules/subscriptions/subscriptions.module");
const auth_guard_1 = require("../../../shared/guards/auth.guard");
const rate_limit_guard_1 = require("../../../shared/guards/rate-limit.guard");
const subscription_guard_1 = require("../../../shared/guards/subscription.guard");
const transform_interceptor_1 = require("../../../shared/interceptors/transform.interceptor");
const usage_tracker_interceptor_1 = require("../../../shared/interceptors/usage-tracker.interceptor");
const ai_request_middleware_1 = require("./middleware/ai-request.middleware");
// Controllers
const health_controller_1 = require("./controllers/health.controller");
const competition_controller_1 = require("./controllers/competition.controller");
const match_controller_1 = require("./controllers/match.controller");
const team_controller_1 = require("./controllers/team.controller");
const player_controller_1 = require("./controllers/player.controller");
const ai_analysis_hardened_controller_1 = require("./controllers/ai-analysis.hardened.controller");
const ai_chat_controller_1 = require("./controllers/ai-chat.controller");
const ai_prediction_controller_1 = require("./controllers/ai-prediction.controller");
const user_controller_1 = require("./controllers/user.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const CONTROLLERS = [
    health_controller_1.HealthController,
    competition_controller_1.CompetitionController,
    match_controller_1.MatchController,
    team_controller_1.TeamController,
    player_controller_1.PlayerController,
    ai_analysis_hardened_controller_1.AiAnalysisHardenedController, // Hardened with Cost Control pipeline
    ai_chat_controller_1.AiChatController,
    ai_prediction_controller_1.AiPredictionController,
    user_controller_1.UserController,
    analytics_controller_1.AnalyticsController, // Admin analytics dashboard
];
const GUARDS = [
    auth_guard_1.AuthGuard,
    rate_limit_guard_1.RateLimitGuard,
    subscription_guard_1.SubscriptionGuard,
];
const INTERCEPTORS = [
    usage_tracker_interceptor_1.UsageTrackerInterceptor,
    transform_interceptor_1.TransformInterceptor,
];
let ApiModule = class ApiModule {
    configure(consumer) {
        // Apply AI request pipeline middleware to all AI endpoints
        consumer
            .apply(ai_request_middleware_1.AiRequestMiddleware)
            .forRoutes('api/ai/(.*)');
    }
};
exports.ApiModule = ApiModule;
exports.ApiModule = ApiModule = __decorate([
    (0, common_1.Module)({
        imports: [domain_module_1.DomainModule, ai_engine_module_1.AiEngineModule, users_module_1.UsersModule, subscriptions_module_1.SubscriptionsModule],
        controllers: CONTROLLERS,
        providers: [
            // Guards
            ...GUARDS,
            { provide: core_1.APP_GUARD, useExisting: auth_guard_1.AuthGuard },
            // Interceptors
            ...INTERCEPTORS,
            { provide: core_1.APP_INTERCEPTOR, useExisting: transform_interceptor_1.TransformInterceptor }, // Last = wraps response
            { provide: core_1.APP_INTERCEPTOR, useExisting: usage_tracker_interceptor_1.UsageTrackerInterceptor },
            // Middleware
            ai_request_middleware_1.AiRequestMiddleware,
        ],
    })
], ApiModule);
//# sourceMappingURL=api.module.js.map