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
var ContentFactoryService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentFactoryService = void 0;
const common_1 = require("@nestjs/common");
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
let ContentFactoryService = ContentFactoryService_1 = class ContentFactoryService {
    taskRepo;
    outputRepo;
    openai;
    promptBuilder;
    costTracker;
    matchesService;
    utmBuilder;
    xhsAdapter;
    twitterAdapter;
    wechatAdapter;
    douyinAdapter;
    seoAdapter;
    logger = new common_1.Logger(ContentFactoryService_1.name);
    platformAdapters;
    constructor(taskRepo, outputRepo, openai, promptBuilder, costTracker, matchesService, utmBuilder, xhsAdapter, twitterAdapter, wechatAdapter, douyinAdapter, seoAdapter) {
        this.taskRepo = taskRepo;
        this.outputRepo = outputRepo;
        this.openai = openai;
        this.promptBuilder = promptBuilder;
        this.costTracker = costTracker;
        this.matchesService = matchesService;
        this.utmBuilder = utmBuilder;
        this.xhsAdapter = xhsAdapter;
        this.twitterAdapter = twitterAdapter;
        this.wechatAdapter = wechatAdapter;
        this.douyinAdapter = douyinAdapter;
        this.seoAdapter = seoAdapter;
        this.platformAdapters = new Map([
            ['xiaohongshu', xhsAdapter],
            ['twitter', twitterAdapter],
            ['wechat', wechatAdapter],
            ['douyin', douyinAdapter],
            ['seo', seoAdapter],
        ]);
    }
    async createTask(params) {
        const task = this.taskRepo.create({
            trigger_type: params.trigger_type,
            reference_type: params.reference_type,
            reference_id: params.reference_id,
            content_type: params.content_type,
            target_platforms: params.target_platforms,
            status: content_task_entity_1.ContentStatus.PENDING,
            priority: params.priority,
            input_context: params.input_context,
        });
        const saved = await this.taskRepo.save(task);
        // Fire-and-forget generation
        this.generateForTask(saved).catch(err => {
            this.logger.error(`Content generation failed for task ${saved.id}`, err);
        });
        return saved;
    }
    async generateForTask(task) {
        this.logger.log(`[Factory] Generating task=${task.id} type=${task.content_type} platforms=${task.target_platforms}`);
        // Mark as generating
        await this.taskRepo.update(task.id, { status: content_task_entity_1.ContentStatus.GENERATING });
        try {
            // 1. Build AI prompt based on content type and context
            const match = task.reference_id
                ? await this.matchesService.findById(task.reference_id).catch(() => null)
                : null;
            const systemPrompt = this.buildContentPrompt(task, match);
            // 2. Generate base content via LLM
            const cost = this.costTracker.estimateCall({
                tier: 'vip', // Content generation uses system-tier budget
                model: 'gpt-4o',
                estimatedInputTokens: 1500,
                estimatedOutputTokens: 2000,
            });
            const result = await this.openai.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: this.buildUserPrompt(task, match) },
            ], { temperature: 0.8, maxTokens: 2000 });
            this.costTracker.recordCall({
                user_id: 'system',
                action: 'content_generation',
                model: result.model,
                input_tokens: 1500,
                output_tokens: result.tokensUsed || 2000,
                estimated_cost_usd: cost.estimatedCost,
                tier: 'vip',
            });
            // 3. Adapt for each target platform
            const contentId = `ct_${task.id.substring(0, 8)}_${Date.now()}`;
            let totalTokens = result.tokensUsed || 2000;
            for (const platform of task.target_platforms) {
                const adapter = this.platformAdapters.get(platform);
                if (!adapter)
                    continue;
                const adapted = await adapter.adapt(result.answer, {
                    taskId: task.id,
                    contentType: task.content_type,
                    context: task.input_context,
                    matchData: match ? {
                        homeTeam: match.home_team?.name,
                        awayTeam: match.away_team?.name,
                        homeScore: match.home_score,
                        awayScore: match.away_score,
                        competition: match.competition?.name,
                    } : undefined,
                });
                // Build UTM-tracked URL
                const utmUrl = this.utmBuilder.build({
                    platform,
                    contentId,
                    contentType: task.content_type,
                    referenceId: task.reference_id,
                });
                await this.outputRepo.save(this.outputRepo.create({
                    task_id: task.id,
                    platform,
                    title: adapted.title,
                    content: adapted.body,
                    format: adapted.format,
                    hashtags: adapted.hashtags,
                    utm_url: utmUrl,
                    content_id: contentId,
                    model_version: result.model,
                    tokens_used: Math.round(result.tokensUsed / task.target_platforms.length),
                    confidence_score: 75,
                }));
                this.logger.log(`[Factory] Generated ${platform} output for task=${task.id}`);
            }
            await this.taskRepo.update(task.id, {
                status: content_task_entity_1.ContentStatus.COMPLETED,
                model_version: result.model,
                total_tokens_used: totalTokens,
                completed_at: new Date(),
            });
        }
        catch (err) {
            this.logger.error(`Content generation failed for task=${task.id}`, err);
            await this.taskRepo.update(task.id, { status: content_task_entity_1.ContentStatus.FAILED });
        }
    }
    buildContentPrompt(task, match) {
        const base = `You are a viral sports content creator for AI Sports OS.
Write engaging, authentic content in Chinese (zh-CN).
Match the platform's native style — don't write generic articles.
Include emojis naturally. Use data points but stay conversational.
NEVER fabricate scores or stats. If data is missing, omit it.`;
        const typeInstructions = {
            post_match: 'Write a post-match recap highlighting the key moments, turning points, and standout players.',
            pre_match: 'Write a pre-match preview building anticipation. Focus on the matchup, key players to watch, and stakes.',
            player_spotlight: 'Write a player spotlight celebrating their performance. Use specific stats and moments.',
            hot_take: 'Write a bold, opinionated take on this match. Be provocative but fair. Spark discussion.',
            ranking: 'Write a ranking/list style post. Power rankings, top 5 moments, etc.',
            fun_fact: 'Write a surprising stat or fact that makes people want to share.',
            team_deep_dive: 'Write a deep analysis of the team\'s tactical approach and recent form.',
        };
        return `${base}\n\nCONTENT TYPE: ${typeInstructions[task.content_type] || 'Write an engaging sports post.'}`;
    }
    buildUserPrompt(task, match) {
        const ctx = task.input_context;
        const parts = [];
        if (ctx.homeTeam && ctx.awayTeam) {
            parts.push(`MATCH: ${ctx.homeTeam} vs ${ctx.awayTeam}`);
        }
        if (ctx.score) {
            parts.push(`SCORE: ${ctx.score}`);
        }
        if (ctx.competition) {
            parts.push(`COMPETITION: ${ctx.competition}`);
        }
        if (ctx.playerName) {
            parts.push(`PLAYER: ${ctx.playerName} — ${ctx.milestone || ''}`);
        }
        if (ctx.angle) {
            parts.push(`ANGLE: ${ctx.angle}`);
        }
        if (match?.events) {
            const goals = match.events
                .filter((e) => e.type === 'goal')
                .map((e) => `${e.minute}' ${e.comment || ''}`)
                .join(', ');
            if (goals)
                parts.push(`GOALS: ${goals}`);
        }
        return parts.join('\n');
    }
};
exports.ContentFactoryService = ContentFactoryService;
exports.ContentFactoryService = ContentFactoryService = ContentFactoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_task_entity_1.ContentTask)),
    __param(1, (0, typeorm_1.InjectRepository)(content_output_entity_1.ContentOutput)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, openai_service_1.OpenaiService,
        prompt_builder_service_1.PromptBuilderService,
        cost_tracker_service_1.CostTrackerService,
        matches_service_1.MatchesService,
        utm_builder_service_1.UtmBuilderService,
        xiaohongshu_adapter_1.XhsAdapter,
        twitter_adapter_1.TwitterAdapter,
        wechat_adapter_1.WechatAdapter,
        douyin_adapter_1.DouyinAdapter,
        seo_adapter_1.SeoAdapter])
], ContentFactoryService);
//# sourceMappingURL=content-factory.service.js.map