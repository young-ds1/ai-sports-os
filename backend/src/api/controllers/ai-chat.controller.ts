import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatAgentService } from '../../../../modules/ai-engine/chat/chat-agent.service';
import { ChatService } from '../../../../modules/ai-engine/chat/chat.service';
import { CostTrackerService } from '../../../../modules/ai-engine/cost/cost-tracker.service';
import { PaywallTriggerService } from '../../../../modules/subscriptions/paywall-trigger.service';
import { TieredResponseService } from '../../../../modules/subscriptions/tiered-response.service';
import { ABTestService } from '../../../../modules/subscriptions/ab-test.service';
import { PreviewTeaserService } from '../../../../modules/subscriptions/preview-teaser.service';
import { SubscriptionsService } from '../../../../modules/subscriptions/subscriptions.service';
import { Public } from '../../../../shared/decorators/public.decorator';
import { RateLimitGuard } from '../../../../shared/guards/rate-limit.guard';
import { SubscriptionGuard, AiAction, AiActionType } from '../../../../shared/guards/subscription.guard';

@Controller('api/ai/chat')
@UseGuards(RateLimitGuard, SubscriptionGuard)
export class AiChatController {
  constructor(
    private readonly chatAgent: ChatAgentService,
    private readonly chatService: ChatService,
    private readonly costTracker: CostTrackerService,
    private readonly paywallTrigger: PaywallTriggerService,
    private readonly tieredResponse: TieredResponseService,
    private readonly abTest: ABTestService,
    private readonly previewTeaser: PreviewTeaserService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post()
  @Public()
  @AiAction(AiActionType.CHAT)
  async sendMessage(@Body() body: {
    sessionId?: string;
    message: string;
    matchId?: string;
    teamId?: string;
    playerId?: string;
    matchStage?: string;
    matchName?: string;
  }, @Req() req: any) {
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
    let paywallPreview: string | null = null;
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
    let afterTeaser: string | null = null;
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

  @Post('history')
  @Public()
  async getHistory(@Body() body: { sessionId: string }) {
    const messages = await this.chatService.getMessages(body.sessionId);
    return { data: messages };
  }
}
