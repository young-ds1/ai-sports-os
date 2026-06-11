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
var ContentExplosionService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentExplosionService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const content_task_entity_1 = require("../entities/content-task.entity");
const content_output_entity_1 = require("../entities/content-output.entity");
const openai_service_1 = require("../../ai-engine/engines/openai.service");
const prompt_builder_service_1 = require("../../ai-engine/engines/prompt-builder.service");
const cost_tracker_service_1 = require("../../ai-engine/cost/cost-tracker.service");
const matches_service_1 = require("../../domain/matches/matches.service");
const xiaohongshu_adapter_1 = require("../adapters/xiaohongshu.adapter");
const twitter_adapter_1 = require("../adapters/twitter.adapter");
const wechat_adapter_1 = require("../adapters/wechat.adapter");
const douyin_adapter_1 = require("../adapters/douyin.adapter");
const seo_adapter_1 = require("../adapters/seo.adapter");
const utm_builder_service_1 = require("../distribution/utm-builder.service");
const hook_optimizer_service_1 = require("./hook-optimizer.service");
let ContentExplosionService = ContentExplosionService_1 = class ContentExplosionService {
    taskRepo;
    outputRepo;
    openai;
    promptBuilder;
    costTracker;
    matchesService;
    utmBuilder;
    hookOptimizer;
    logger = new common_1.Logger(ContentExplosionService_1.name);
    platformAdapters;
    constructor(taskRepo, outputRepo, openai, promptBuilder, costTracker, matchesService, utmBuilder, hookOptimizer, xhsAdapter, twitterAdapter, wechatAdapter, douyinAdapter, seoAdapter) {
        this.taskRepo = taskRepo;
        this.outputRepo = outputRepo;
        this.openai = openai;
        this.promptBuilder = promptBuilder;
        this.costTracker = costTracker;
        this.matchesService = matchesService;
        this.utmBuilder = utmBuilder;
        this.hookOptimizer = hookOptimizer;
        this.platformAdapters = new Map([
            ['xiaohongshu', xhsAdapter],
            ['twitter', twitterAdapter],
            ['wechat', wechatAdapter],
            ['douyin', douyinAdapter],
            ['seo', seoAdapter],
        ]);
    }
    /**
     * Listen for explosive signals from the SignalRanker.
     * One signal → explosion across all 5 platforms in parallel.
     */
    async onExplosiveSignal(signal) {
        const startTime = Date.now();
        this.logger.log(`💥 [EXPLOSION] Processing: ${signal.matchData.homeTeam} vs ${signal.matchData.awayTeam} ` +
            `| tier=${signal.tier} | score=${signal.totalScore} | reason="${signal.reason}"`);
        try {
            // 1. Create the primary content task
            const task = await this.createExplosionTask(signal);
            // 2. Generate optimized AI content
            const rawContent = await this.generateContent(signal, task);
            // 3. Explode across all 5 platforms in parallel
            const platformResults = await this.explodeToPlatforms(task, signal, rawContent);
            // 4. Update task with results
            const successCount = platformResults.filter(r => r.success).length;
            await this.taskRepo.update(task.id, {
                status: successCount > 0 ? content_task_entity_1.ContentStatus.COMPLETED : content_task_entity_1.ContentStatus.FAILED,
                model_version: 'gpt-4o-explosion',
                total_tokens_used: platformResults.length * 2000,
                completed_at: new Date(),
            });
            const totalMs = Date.now() - startTime;
            this.logger.log(`✅ [EXPLOSION] Complete: ${successCount}/${platformResults.length} platforms ` +
                `| ${totalMs}ms | task=${task.id}`);
        }
        catch (err) {
            this.logger.error(`[EXPLOSION] Failed for ${signal.matchId}`, err);
        }
    }
    /**
     * Create the master content task for this explosion.
     */
    async createExplosionTask(signal) {
        const contentType = this.mapSignalToContentType(signal);
        const task = this.taskRepo.create({
            trigger_type: content_task_entity_1.ContentTrigger.MATCH_FINISHED,
            reference_type: 'match',
            reference_id: signal.matchId,
            content_type: contentType,
            target_platforms: ['xiaohongshu', 'twitter', 'wechat', 'douyin', 'seo'],
            status: content_task_entity_1.ContentStatus.GENERATING,
            priority: signal.tier === 'nuclear' ? 10 : 7,
            input_context: {
                matchId: signal.matchId,
                homeTeam: signal.matchData.homeTeam,
                awayTeam: signal.matchData.awayTeam,
                score: `${signal.matchData.homeScore || 0}-${signal.matchData.awayScore || 0}`,
                hotReason: signal.reason,
                hotScore: signal.totalScore,
                tier: signal.tier,
                importanceScore: signal.importanceScore,
                starPowerScore: signal.starPowerScore,
                momentumScore: signal.momentumScore,
                buzzScore: signal.buzzScore,
            },
        });
        return this.taskRepo.save(task);
    }
    /**
     * Map explosion signal to content type.
     * Nuclear tier gets multiple content types.
     */
    mapSignalToContentType(signal) {
        const goals = (signal.matchData.homeScore || 0) + (signal.matchData.awayScore || 0);
        if (signal.matchData.hasComeback || signal.matchData.lateDramaMinutes >= 90) {
            return content_task_entity_1.ContentType.HOT_TAKE;
        }
        if (goals >= 5)
            return content_task_entity_1.ContentType.HOT_TAKE;
        if (signal.matchData.isPenaltyShootout)
            return content_task_entity_1.ContentType.POST_MATCH;
        if (signal.tier === 'nuclear')
            return content_task_entity_1.ContentType.POST_MATCH;
        return content_task_entity_1.ContentType.POST_MATCH;
    }
    /**
     * Generate AI content with hook optimization.
     * The prompt is enhanced by:
     * - HotScore reason (why this match matters)
     * - Best-performing hook patterns from feedback data
     */
    async generateContent(signal, task) {
        const match = await this.matchesService.findById(signal.matchId).catch(() => null);
        // Get winning hook patterns
        const bestHooks = this.hookOptimizer.getBestPatterns(3);
        const systemPrompt = `You are a viral sports content creator. Write content that EXPLODES on social media.

MATCH CONTEXT:
- ${signal.matchData.homeTeam} vs ${signal.matchData.awayTeam}
- Score: ${signal.matchData.homeScore || 0}-${signal.matchData.awayScore || 0}
- Why this is HOT: ${signal.reason}
- HotScore: ${signal.totalScore}/100 (${signal.tier})

WRITING RULES:
${bestHooks.map((h, i) => `${i + 1}. ${h.pattern} (CTR: ${(h.avgCtr * 100).toFixed(1)}%)`).join('\n')}

FORMAT:
- Write in Chinese (zh-CN)
- Lead with the most dramatic element
- Include specific numbers/stats
- End with a question to spark discussion
- Make it shareable`;
        const cost = this.costTracker.estimateCall({
            tier: 'vip',
            model: 'gpt-4o',
            estimatedInputTokens: 2000,
            estimatedOutputTokens: 2500,
        });
        const result = await this.openai.chat([
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `Write explosive content about: ${signal.reason}\n\n` +
                    `Match events: ${match?.events?.map(e => `${e.minute}' ${e.comment}`).join(' | ') || 'No data'}`,
            },
        ], { temperature: 0.85, maxTokens: 2500 });
        this.costTracker.recordCall({
            user_id: 'system',
            action: 'content_explosion',
            model: result.model,
            input_tokens: 2000,
            output_tokens: result.tokensUsed || 2500,
            estimated_cost_usd: cost.estimatedCost,
            tier: 'vip',
            match_id: signal.matchId,
        });
        return result.answer;
    }
    /**
     * Explode content to all 5 platforms in parallel.
     * Each platform gets its own optimized version.
     */
    async explodeToPlatforms(task, signal, rawContent) {
        const contentId = `explode_${signal.matchId.substring(0, 8)}_${Date.now()}`;
        const platforms = task.target_platforms;
        // Parallel explosion
        const results = await Promise.allSettled(platforms.map(async (platform) => {
            const t0 = Date.now();
            const adapter = this.platformAdapters.get(platform);
            if (!adapter) {
                return { platform, success: false, error: 'No adapter', latencyMs: 0 };
            }
            try {
                const adapted = await adapter.adapt(rawContent, {
                    taskId: task.id,
                    contentType: task.content_type,
                    context: task.input_context,
                    matchData: {
                        homeTeam: signal.matchData.homeTeam,
                        awayTeam: signal.matchData.awayTeam,
                        homeScore: signal.matchData.homeScore,
                        awayScore: signal.matchData.awayScore,
                        competition: signal.matchData.competition,
                    },
                });
                // Apply hook optimizer to enhance the adapted content
                const optimizedBody = this.hookOptimizer.enhance(platform, adapted.body, signal);
                // Build UTM URL
                const utmUrl = this.utmBuilder.build({
                    platform,
                    contentId,
                    contentType: task.content_type,
                    referenceId: signal.matchId,
                });
                const output = this.outputRepo.create({
                    task_id: task.id,
                    platform,
                    title: adapted.title,
                    content: optimizedBody,
                    format: adapted.format,
                    hashtags: adapted.hashtags,
                    utm_url: utmUrl,
                    content_id: contentId,
                    model_version: 'gpt-4o',
                    tokens_used: Math.round(2500 / platforms.length),
                    confidence_score: signal.totalScore, // Use hot score as confidence
                });
                const saved = await this.outputRepo.save(output);
                return { platform, success: true, outputId: saved.id, latencyMs: Date.now() - t0 };
            }
            catch (err) {
                this.logger.error(`[EXPLOSION] ${platform} adapter failed: ${err.message}`);
                return { platform, success: false, error: err.message, latencyMs: Date.now() - t0 };
            }
        }));
        return results.map((r, i) => r.status === 'fulfilled'
            ? r.value
            : { platform: platforms[i], success: false, error: 'Promise rejected', latencyMs: 0 });
    }
};
exports.ContentExplosionService = ContentExplosionService;
__decorate([
    (0, event_emitter_1.OnEvent)('content.explode', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentExplosionService.prototype, "onExplosiveSignal", null);
exports.ContentExplosionService = ContentExplosionService = ContentExplosionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_task_entity_1.ContentTask)),
    __param(1, (0, typeorm_1.InjectRepository)(content_output_entity_1.ContentOutput)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, openai_service_1.OpenaiService,
        prompt_builder_service_1.PromptBuilderService,
        cost_tracker_service_1.CostTrackerService,
        matches_service_1.MatchesService,
        utm_builder_service_1.UtmBuilderService,
        hook_optimizer_service_1.HookOptimizerService,
        xiaohongshu_adapter_1.XhsAdapter,
        twitter_adapter_1.TwitterAdapter,
        wechat_adapter_1.WechatAdapter,
        douyin_adapter_1.DouyinAdapter,
        seo_adapter_1.SeoAdapter])
], ContentExplosionService);
//# sourceMappingURL=content-explosion.service.js.map