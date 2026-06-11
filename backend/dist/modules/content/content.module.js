"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const domain_module_1 = require("../domain/domain.module");
const ai_engine_module_1 = require("../ai-engine/ai-engine.module");
const users_module_1 = require("../users/users.module");
const content_task_entity_1 = require("./entities/content-task.entity");
const content_output_entity_1 = require("./entities/content-output.entity");
const content_service_1 = require("./content.service");
const signal_service_1 = require("./signals/signal.service");
const hot_score_service_1 = require("./signals/hot-score.service");
const signal_ranker_service_1 = require("./signals/signal-ranker.service");
const content_factory_service_1 = require("./factory/content-factory.service");
const content_explosion_service_1 = require("./factory/content-explosion.service");
const hook_optimizer_service_1 = require("./factory/hook-optimizer.service");
const content_controller_1 = require("./content.controller");
const xiaohongshu_adapter_1 = require("./adapters/xiaohongshu.adapter");
const twitter_adapter_1 = require("./adapters/twitter.adapter");
const wechat_adapter_1 = require("./adapters/wechat.adapter");
const douyin_adapter_1 = require("./adapters/douyin.adapter");
const seo_adapter_1 = require("./adapters/seo.adapter");
const utm_builder_service_1 = require("./distribution/utm-builder.service");
const distribution_service_1 = require("./distribution/distribution.service");
const engagement_tracker_service_1 = require("./feedback/engagement-tracker.service");
const growth_analytics_service_1 = require("./feedback/growth-analytics.service");
const growth_feedback_service_1 = require("./feedback/growth-feedback.service");
const CONTENT_ENTITIES = [content_task_entity_1.ContentTask, content_output_entity_1.ContentOutput];
const CONTENT_SERVICES = [
    // Core
    content_service_1.ContentService,
    // Signal Layer (v2 — ranked)
    hot_score_service_1.HotScoreService, signal_ranker_service_1.SignalRankerService, signal_service_1.SignalService,
    // Content Generation
    content_factory_service_1.ContentFactoryService, content_explosion_service_1.ContentExplosionService, hook_optimizer_service_1.HookOptimizerService,
    // Platform Adapters
    xiaohongshu_adapter_1.XhsAdapter, twitter_adapter_1.TwitterAdapter, wechat_adapter_1.WechatAdapter, douyin_adapter_1.DouyinAdapter, seo_adapter_1.SeoAdapter,
    // Distribution
    utm_builder_service_1.UtmBuilderService, distribution_service_1.DistributionService,
    // Feedback & Growth
    engagement_tracker_service_1.EngagementTrackerService, growth_analytics_service_1.GrowthAnalyticsService, growth_feedback_service_1.GrowthFeedbackService,
];
let ContentModule = class ContentModule {
};
exports.ContentModule = ContentModule;
exports.ContentModule = ContentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature(CONTENT_ENTITIES),
            event_emitter_1.EventEmitterModule.forRoot(),
            domain_module_1.DomainModule,
            ai_engine_module_1.AiEngineModule,
            users_module_1.UsersModule,
        ],
        controllers: [content_controller_1.ContentController],
        providers: CONTENT_SERVICES,
        exports: [
            content_service_1.ContentService, content_factory_service_1.ContentFactoryService, content_explosion_service_1.ContentExplosionService,
            distribution_service_1.DistributionService, growth_analytics_service_1.GrowthAnalyticsService, growth_feedback_service_1.GrowthFeedbackService,
            signal_ranker_service_1.SignalRankerService, hook_optimizer_service_1.HookOptimizerService,
        ],
    })
], ContentModule);
//# sourceMappingURL=content.module.js.map