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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_agent_service_1 = require("../../../../modules/ai-engine/chat/chat-agent.service");
const chat_service_1 = require("../../../../modules/ai-engine/chat/chat.service");
const cost_tracker_service_1 = require("../../../../modules/ai-engine/cost/cost-tracker.service");
const paywall_trigger_service_1 = require("../../../../modules/subscriptions/paywall-trigger.service");
const tiered_response_service_1 = require("../../../../modules/subscriptions/tiered-response.service");
const ab_test_service_1 = require("../../../../modules/subscriptions/ab-test.service");
const preview_teaser_service_1 = require("../../../../modules/subscriptions/preview-teaser.service");
const subscriptions_service_1 = require("../../../../modules/subscriptions/subscriptions.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
const rate_limit_guard_1 = require("../../../../shared/guards/rate-limit.guard");
const subscription_guard_1 = require("../../../../shared/guards/subscription.guard");
let AiChatController = class AiChatController {
    chatAgent;
    chatService;
    costTracker;
    paywallTrigger;
    tieredResponse;
    abTest;
    previewTeaser;
    subscriptionsService;
    constructor(chatAgent, chatService, costTracker, paywallTrigger, tieredResponse, abTest, previewTeaser, subscriptionsService) {
        this.chatAgent = chatAgent;
        this.chatService = chatService;
        this.costTracker = costTracker;
        this.paywallTrigger = paywallTrigger;
        this.tieredResponse = tieredResponse;
        this.abTest = abTest;
        this.previewTeaser = previewTeaser;
        this.subscriptionsService = subscriptionsService;
    }
    async sendMessage(body, req) {
        const user = req.user || { id: 'anonymous', tier: 'free' };
        const userId = user.id || 'anonymous';
        const userTier = this.subscriptionsService.getUserTier(userId);
        const subCtx = req.subscriptionContext;
        // ── A/B Test: Check if teasers should be shown ──
        const abConfig = this.abTest.shouldShowTeasers(userId);
        this.abTest.trackAction(userId, 'question');
        // ── Cost check ──
        const costEstimate = this.costTracker.estimateCall({
            tier: userTier,
            model: userTier === 'pro' ? 'gpt-4o' : 'gpt-4o-mini',
            estimatedInputTokens: 800,
            estimatedOutputTokens: userTier === 'free' ? 400 : userTier === 'vip' ? 1000 : 2000,
        });
        if (!costEstimate.withinBudget) {
            return {
                message: { role: 'assistant', message: '今日 AI 配额已用完，请明天再试或升级会员。', sources: [], confidence: 0 },
                meta: { error: 'budget_exceeded', upgrade_url: '/user/upgrade' },
            };
        }
        // ── Create or reuse session ──
        let sessionId = body.sessionId;
        if (!sessionId) {
            const session = await this.chatService.createSession({
                userId,
                matchId: body.matchId,
                title: body.message.substring(0, 50),
            });
            sessionId = session.id;
        }
        // ── Get conversation history for context ──
        const messages = await this.chatService.getMessages(sessionId);
        const consecutiveQuestions = messages.filter(m => m.role === 'user').length + 1;
        // ── Paywall trigger detection ──
        const paywallSignal = this.paywallTrigger.analyze(body.message, {
            userTier,
            consecutiveQuestions,
            matchStage: body.matchStage,
            matchName: body.matchName,
        });
        // ── For Free users with aggressive teaser timing (Group C): show preview BEFORE answering ──
        let paywallPreview = null;
        if (paywallSignal && abConfig.show && abConfig.timing === 'before') {
            const teaserResp = this.previewTeaser.buildPaywallResponse(paywallSignal.category);
            paywallPreview = teaserResp.message;
        }
        // ── Build tiered prompt ──
        const promptConfig = this.tieredResponse.getPromptConfig(userTier, body.message);
        // ── Save user message ──
        await this.chatService.addMessage({
            sessionId,
            role: 'user',
            message: body.message,
        });
        // ── Run agent with tier-appropriate depth ──
        const response = await this.chatAgent.answer(body.message, {
            matchId: body.matchId,
            teamId: body.teamId,
            playerId: body.playerId,
        });
        // ── Tierify the response (add/remove layers based on tier) ──
        const tieredOutput = this.tieredResponse.tierify(response.message, userTier);
        // ── For Group B: show teaser AFTER answering ──
        let afterTeaser = null;
        if (paywallSignal && abConfig.show && abConfig.timing === 'after') {
            const teaserResp = this.previewTeaser.buildPaywallResponse(paywallSignal.category);
            afterTeaser = teaserResp.message;
        }
        // ── Assemble final message ──
        const finalMessage = [
            tieredOutput.common.summary,
            paywallPreview,
            afterTeaser,
        ].filter(Boolean).join('\n');
        // ── Cost tracking ──
        if (response.sources?.some(s => s.type === 'llm_inference')) {
            this.costTracker.recordCall({
                user_id: userId,
                action: 'ai_chat_message',
                model: promptConfig.maxTokens > 1000 ? 'gpt-4o' : 'gpt-4o-mini',
                input_tokens: 800,
                output_tokens: promptConfig.maxTokens,
                estimated_cost_usd: costEstimate.estimatedCost,
                tier: userTier,
                match_id: body.matchId,
            });
        }
        // ── Save assistant message ──
        const assistantMsg = await this.chatService.addMessage({
            sessionId,
            role: 'assistant',
            message: finalMessage,
            sources: response.sources,
            confidenceScore: response.confidence,
        });
        return {
            sessionId,
            message: {
                id: assistantMsg.id,
                role: 'assistant',
                message: finalMessage,
                sources: response.sources,
                confidence: response.confidence,
            },
            monetization: {
                tier: userTier,
                ab_group: this.abTest.assignGroup(userId),
                paywall_triggered: !!paywallSignal,
                trigger_category: paywallSignal?.category || null,
                features_unlocked: tieredOutput.meta.features_unlocked,
                features_locked: tieredOutput.meta.features_locked,
                upgrade_cta: tieredOutput.meta.upgrade_cta,
            },
            meta: {
                remaining: (subCtx?.remaining || 1) - 1,
                limit: subCtx?.dailyLimit,
                estimated_cost: costEstimate.estimatedCost,
            },
        };
    }
    async getHistory(body) {
        const messages = await this.chatService.getMessages(body.sessionId);
        return { data: messages };
    }
};
exports.AiChatController = AiChatController;
__decorate([
    (0, common_1.Post)(),
    (0, public_decorator_1.Public)(),
    (0, subscription_guard_1.AiAction)(subscription_guard_1.AiActionType.CHAT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('history'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiChatController.prototype, "getHistory", null);
exports.AiChatController = AiChatController = __decorate([
    (0, common_1.Controller)('api/ai/chat'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard, subscription_guard_1.SubscriptionGuard),
    __metadata("design:paramtypes", [chat_agent_service_1.ChatAgentService,
        chat_service_1.ChatService,
        cost_tracker_service_1.CostTrackerService,
        paywall_trigger_service_1.PaywallTriggerService,
        tiered_response_service_1.TieredResponseService,
        ab_test_service_1.ABTestService,
        preview_teaser_service_1.PreviewTeaserService,
        subscriptions_service_1.SubscriptionsService])
], AiChatController);
//# sourceMappingURL=ai-chat.controller.js.map