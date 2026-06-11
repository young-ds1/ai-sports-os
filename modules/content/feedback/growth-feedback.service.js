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
var GrowthFeedbackService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthFeedbackService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const content_output_entity_1 = require("../entities/content-output.entity");
const hook_optimizer_service_1 = require("../factory/hook-optimizer.service");
const user_usage_service_1 = require("../../users/user-usage.service");
let GrowthFeedbackService = GrowthFeedbackService_1 = class GrowthFeedbackService {
    outputRepo;
    hookOptimizer;
    userUsageService;
    logger = new common_1.Logger(GrowthFeedbackService_1.name);
    constructor(outputRepo, hookOptimizer, userUsageService) {
        this.outputRepo = outputRepo;
        this.hookOptimizer = hookOptimizer;
        this.userUsageService = userUsageService;
    }
    /**
     * Process feedback batch:
     * 1. Pull all published content
     * 2. Calculate performance metrics
     * 3. Update hook pattern scores
     * 4. Identify winning content formulas
     */
    async processFeedbackBatch(daysBack = 7) {
        const since = new Date();
        since.setDate(since.getDate() - daysBack);
        const outputs = await this.outputRepo
            .createQueryBuilder('output')
            .where('output.published_at IS NOT NULL')
            .andWhere('output.published_at >= :since', { since })
            .getMany();
        const snapshots = [];
        const insights = [];
        for (const output of outputs) {
            const engagement = output.engagement || {};
            const views = engagement.views || 0;
            const clicks = engagement.clicks || 0;
            const likes = engagement.likes || 0;
            const shares = engagement.shares || 0;
            const comments = engagement.comments || 0;
            const conversions = engagement.conversions || 0;
            const ctr = views > 0 ? clicks / views : 0;
            const engagementScore = likes * 2 + shares * 5 + comments * 3;
            const daysSince = output.published_at
                ? Math.max(1, Math.floor((Date.now() - new Date(output.published_at).getTime()) / 86400000))
                : 1;
            snapshots.push({
                contentId: output.content_id || output.id,
                platform: output.platform,
                publishedAt: output.published_at,
                ctr,
                engagement: engagementScore,
                conversions,
                daysSincePublish: daysSince,
            });
            // Feed back to HookOptimizer
            if (ctr > 0) {
                const patternId = this.inferPattern(output.content, output.platform);
                this.hookOptimizer.recordEngagement(patternId, {
                    ctr,
                    engagement: engagementScore,
                });
            }
        }
        // Sort by engagement per day
        snapshots.sort((a, b) => (b.engagement / b.daysSincePublish) - (a.engagement / a.daysSincePublish));
        const topPerformers = snapshots.slice(0, 5);
        // Generate insights
        if (topPerformers.length > 0) {
            const best = topPerformers[0];
            insights.push(`🏆 最佳内容：${best.platform} 平台，CTR ${(best.ctr * 100).toFixed(1)}%，` +
                `互动 ${best.engagement}，发布 ${best.daysSincePublish} 天`);
        }
        // Platform comparison
        const byPlatform = {};
        for (const s of snapshots) {
            if (!byPlatform[s.platform])
                byPlatform[s.platform] = { total: 0, totalCtr: 0 };
            byPlatform[s.platform].total++;
            byPlatform[s.platform].totalCtr += s.ctr;
        }
        const bestPlatform = Object.entries(byPlatform)
            .filter(([, d]) => d.total > 0)
            .sort((a, b) => (b[1].totalCtr / b[1].total) - (a[1].totalCtr / a[1].total))[0];
        if (bestPlatform) {
            insights.push(`📱 最高CTR平台：${bestPlatform[0]} (${((bestPlatform[1].totalCtr / bestPlatform[1].total) * 100).toFixed(1)}%)`);
        }
        // AI usage correlation
        const aiPerDau = await this.userUsageService.getAiRequestsPerDau();
        insights.push(`📊 当前 AI Requests/DAU: ${aiPerDau.toFixed(1)} ` +
            (aiPerDau >= 1.0 ? '✅ 需求已验证' : '⚠️ 需要更多引流'));
        this.logger.log(`[Feedback] Analyzed ${snapshots.length} pieces | ` +
            `${topPerformers.length} top performers | ${insights.length} insights`);
        return {
            analyzed: snapshots.length,
            topPerformers,
            updatedPatterns: snapshots.filter(s => s.ctr > 0).length,
            insights,
        };
    }
    /**
     * Infer which hook pattern was used based on content analysis.
     * Simplified: checks first characters for pattern matching.
     */
    inferPattern(content, platform) {
        const firstLine = content.trim().split('\n')[0] || '';
        if (/^\d/.test(firstLine))
            return 'numbers-first';
        if (firstLine.includes('？') || firstLine.includes('?'))
            return 'question-hook';
        if (content.includes('🧵'))
            return 'thread-tease';
        if (firstLine.includes('暴露') || firstLine.includes('致命'))
            return 'hot-take';
        if ((firstLine.match(/[\u{1F000}-\u{1FFFF}]/gu) || []).length >= 3)
            return 'emoji-story';
        if (content.includes('数据') || content.includes('%'))
            return 'data-drop';
        if (content.includes('件事') || content.includes('要点'))
            return 'listicle-hook';
        return 'numbers-first'; // Default
    }
};
exports.GrowthFeedbackService = GrowthFeedbackService;
exports.GrowthFeedbackService = GrowthFeedbackService = GrowthFeedbackService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_output_entity_1.ContentOutput)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, hook_optimizer_service_1.HookOptimizerService,
        user_usage_service_1.UserUsageService])
], GrowthFeedbackService);
//# sourceMappingURL=growth-feedback.service.js.map