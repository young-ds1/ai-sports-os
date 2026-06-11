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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const content_service_1 = require("./content.service");
const content_factory_service_1 = require("./factory/content-factory.service");
const distribution_service_1 = require("./distribution/distribution.service");
const engagement_tracker_service_1 = require("./feedback/engagement-tracker.service");
const growth_analytics_service_1 = require("./feedback/growth-analytics.service");
const growth_feedback_service_1 = require("./feedback/growth-feedback.service");
const hook_optimizer_service_1 = require("./factory/hook-optimizer.service");
const signal_ranker_service_1 = require("./signals/signal-ranker.service");
const content_task_entity_1 = require("./entities/content-task.entity");
const public_decorator_1 = require("../../shared/decorators/public.decorator");
let ContentController = class ContentController {
    contentService;
    contentFactory;
    distributionService;
    engagementTracker;
    growthAnalytics;
    growthFeedback;
    hookOptimizer;
    signalRanker;
    constructor(contentService, contentFactory, distributionService, engagementTracker, growthAnalytics, growthFeedback, hookOptimizer, signalRanker) {
        this.contentService = contentService;
        this.contentFactory = contentFactory;
        this.distributionService = distributionService;
        this.engagementTracker = engagementTracker;
        this.growthAnalytics = growthAnalytics;
        this.growthFeedback = growthFeedback;
        this.hookOptimizer = hookOptimizer;
        this.signalRanker = signalRanker;
    }
    // ── Task Management ──
    async getTasks(status) {
        return this.contentService.getTasks(status);
    }
    async getTaskOutputs(id) {
        return this.contentService.getOutputs(id);
    }
    async retryTask(id) {
        await this.contentService.retryTask(id);
        return { status: 'ok', message: 'Task requeued for generation' };
    }
    // ── Manual Content Creation ──
    async manualGenerate(body) {
        const task = await this.contentFactory.createTask({
            trigger_type: content_task_entity_1.ContentTrigger.MANUAL,
            reference_type: body.reference_type,
            reference_id: body.reference_id,
            content_type: body.content_type,
            target_platforms: body.platforms,
            priority: 3,
            input_context: body.context || {},
        });
        return { task_id: task.id, status: task.status };
    }
    // ── Distribution ──
    async getPendingPublish(platform) {
        return this.distributionService.getPendingOutputs(platform);
    }
    async recordPublish(body) {
        await this.distributionService.recordPublish({
            outputId: body.outputId,
            platform: body.platform,
            publishedUrl: body.publishedUrl,
            publishedAt: new Date(),
            status: 'published',
        });
        return { status: 'ok' };
    }
    // ── Engagement ──
    async updateEngagement(body) {
        await this.engagementTracker.updateEngagement({
            contentId: body.contentId,
            platform: body.platform,
            metric: body.metric,
            value: body.value,
        });
        return { status: 'ok' };
    }
    // ── Feedback Loop (STEP 8) ──
    async processFeedback(days = 7) {
        const result = await this.growthFeedback.processFeedbackBatch(days);
        return { data: result };
    }
    async getTopPerformers(days = 7) {
        const result = await this.growthFeedback.processFeedbackBatch(days);
        return {
            data: result.topPerformers,
            insights: result.insights,
        };
    }
    // ── Hook Optimizer (STEP 8) ──
    async getHookPatterns(platform) {
        if (platform) {
            return { data: this.hookOptimizer.getBestForPlatform(platform, 10) };
        }
        return { data: this.hookOptimizer.getAllPatterns() };
    }
    // ── Signal Ranker (STEP 8) ──
    async getRankerStatus() {
        return { data: this.signalRanker.getStatus() };
    }
    // ── Growth Dashboard ──
    async getGrowthDashboard(days = 7) {
        return this.growthAnalytics.getGrowthDashboard(days);
    }
    async getContentPerformance(days = 7) {
        return this.distributionService.getContentPerformance(days);
    }
    // ── UTM Public Tracking Endpoint (Growth Loop) ──
    // GET /api/content/track?utm_source=xiaohongshu&utm_medium=content&utm_content=explode_abc123&utm_campaign=post_match_2026-06-12&ref=match-003
    // Records the click, then redirects to the target page.
    async trackUtmClick(utmSource, utmMedium, utmCampaign, utmContent, utmTerm, ref, res) {
        const contentId = utmContent || 'unknown';
        const platform = utmSource || 'direct';
        // Fire-and-forget: record the click for engagement tracking
        this.engagementTracker.updateEngagement({
            contentId,
            platform,
            metric: 'clicks',
            value: (async () => {
                // Increment current click count — simplified
                return 1;
            })(),
        }).catch(() => { });
        // Track the attribution event for conversion funnel
        if (ref) {
            this.engagementTracker.updateEngagement({
                contentId,
                platform,
                metric: 'views',
                value: 1,
            }).catch(() => { });
        }
        // Build redirect target
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        let redirectUrl = `${appUrl}/`;
        if (ref && ref.startsWith('match-')) {
            redirectUrl = `${appUrl}/matches/${ref}`;
        }
        // Append UTM params to target for client-side tracking
        const params = new URLSearchParams();
        if (utmSource)
            params.set('utm_source', utmSource);
        if (utmMedium)
            params.set('utm_medium', utmMedium);
        if (utmCampaign)
            params.set('utm_campaign', utmCampaign);
        if (utmContent)
            params.set('utm_content', utmContent);
        if (utmTerm)
            params.set('utm_term', utmTerm);
        const finalUrl = `${redirectUrl}?${params.toString()}`;
        return res.redirect(302, finalUrl);
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Get)('tasks'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)('tasks/:id/outputs'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getTaskOutputs", null);
__decorate([
    (0, common_1.Post)('tasks/:id/retry'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "retryTask", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "manualGenerate", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getPendingPublish", null);
__decorate([
    (0, common_1.Post)('publish'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "recordPublish", null);
__decorate([
    (0, common_1.Post)('engagement'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "updateEngagement", null);
__decorate([
    (0, common_1.Post)('feedback/process'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "processFeedback", null);
__decorate([
    (0, common_1.Get)('feedback/top-performers'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getTopPerformers", null);
__decorate([
    (0, common_1.Get)('hooks'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getHookPatterns", null);
__decorate([
    (0, common_1.Get)('ranker/status'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getRankerStatus", null);
__decorate([
    (0, common_1.Get)('growth'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getGrowthDashboard", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getContentPerformance", null);
__decorate([
    (0, common_1.Get)('track'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('utm_source')),
    __param(1, (0, common_1.Query)('utm_medium')),
    __param(2, (0, common_1.Query)('utm_campaign')),
    __param(3, (0, common_1.Query)('utm_content')),
    __param(4, (0, common_1.Query)('utm_term')),
    __param(5, (0, common_1.Query)('ref')),
    __param(6, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "trackUtmClick", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)('api/content'),
    __metadata("design:paramtypes", [content_service_1.ContentService,
        content_factory_service_1.ContentFactoryService,
        distribution_service_1.DistributionService,
        engagement_tracker_service_1.EngagementTrackerService,
        growth_analytics_service_1.GrowthAnalyticsService,
        growth_feedback_service_1.GrowthFeedbackService,
        hook_optimizer_service_1.HookOptimizerService,
        signal_ranker_service_1.SignalRankerService])
], ContentController);
//# sourceMappingURL=content.controller.js.map