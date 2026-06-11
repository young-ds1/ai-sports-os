import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AnalysisService } from '../../../../modules/ai-engine/analysis/analysis.service';
import { AiCacheService } from '../../../../modules/ai-engine/cache/ai-cache.service';
import { OpenaiService } from '../../../../modules/ai-engine/engines/openai.service';
import { PromptBuilderService } from '../../../../modules/ai-engine/engines/prompt-builder.service';
import { MatchesService } from '../../../../modules/domain/matches/matches.service';
import { CostTrackerService } from '../../../../modules/ai-engine/cost/cost-tracker.service';
import { Public } from '../../../../shared/decorators/public.decorator';
import { RateLimitGuard } from '../../../../shared/guards/rate-limit.guard';
import { SubscriptionGuard, AiActionType, AiAction } from '../../../../shared/guards/subscription.guard';

@Controller('api/ai/analysis')
@UseGuards(RateLimitGuard, SubscriptionGuard)
export class AiAnalysisHardenedController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly cacheService: AiCacheService,
    private readonly openai: OpenaiService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly matchesService: MatchesService,
    private readonly costTracker: CostTrackerService,
  ) {}

  @Get(':matchId')
  @Public()
  @AiAction(AiActionType.ANALYSIS)
  async getAnalysis(@Param('matchId') matchId: string, @Req() req: any) {
    const user = req.user || { id: 'anonymous', tier: 'free' };
    const subCtx = req.subscriptionContext;

    // ── Pipeline: Cache → DB → (Cost Check) → LLM ──

    // Step 1: Redis cache (fastest path)
    const cached = await this.cacheService.getAnalysis(matchId);
    if (cached) {
      return {
        data: cached,
        source: 'cache',
        meta: {
          remaining: subCtx?.remaining,
          limit: subCtx?.dailyLimit,
          cache_hit: true,
        },
      };
    }

    // Step 2: Database (persisted analysis)
    const existing = await this.analysisService.getByMatch(matchId);
    if (existing && existing.expires_at && new Date(existing.expires_at) > new Date()) {
      await this.cacheService.setAnalysis(matchId, existing.content);
      return {
        data: existing.content,
        source: 'database',
        meta: {
          remaining: subCtx?.remaining,
          limit: subCtx?.dailyLimit,
          generated_at: existing.generated_at,
        },
      };
    }

    // Step 3: Cost check before LLM call
    const costEstimate = this.costTracker.estimateCall({
      tier: user.tier || 'free',
      model: 'gpt-4o',
      estimatedInputTokens: 2000,
      estimatedOutputTokens: 1500,
    });

    if (!costEstimate.withinBudget) {
      return {
        data: existing?.content || null,
        source: 'budget_exceeded',
        meta: {
          error: 'Daily AI budget exceeded. Please try again tomorrow or upgrade.',
          upgrade_url: '/user/upgrade',
        },
      };
    }

    // Step 4: Generate new analysis via LLM
    const match = await this.matchesService.findById(matchId);
    if (!match) return { error: 'Match not found' };

    const context = {
      home_team: match.home_team?.name || 'Unknown',
      away_team: match.away_team?.name || 'Unknown',
      competition: match.competition?.name || 'Unknown',
      match_date: match.match_date,
      status: match.status,
      home_score: match.home_score,
      away_score: match.away_score,
      stats: match.stats_summary,
      events: match.events?.map(e => ({ type: e.type, minute: e.minute, comment: e.comment })),
    };

    const prompt = this.promptBuilder.buildAnalysisPrompt(
      context,
      match.status === 'finished' ? 'post_match' : 'pre_match',
    );

    const result = await this.openai.chat([
      { role: 'system', content: prompt },
    ]);

    // Record cost
    this.costTracker.recordCall({
      user_id: user.id || 'anonymous',
      action: 'ai_analysis_request',
      model: result.model,
      input_tokens: 2000,
      output_tokens: result.tokensUsed > 0 ? result.tokensUsed : 1500,
      estimated_cost_usd: costEstimate.estimatedCost,
      tier: user.tier || 'free',
      match_id: matchId,
    });

    const content = { summary: result.answer, generated_at: new Date().toISOString() };

    // Persist
    await this.analysisService.create({
      match_id: matchId,
      analysis_type: match.status === 'finished' ? 'post_match' : 'pre_match',
      content,
      model_version: result.model,
      tokens_used: result.tokensUsed,
      confidence_score: 75,
      input_context: { match_id: matchId, cost_check: costEstimate },
      expires_at: new Date(Date.now() + 24 * 3600 * 1000),
    });

    // Cache
    await this.cacheService.setAnalysis(matchId, content);

    return {
      data: content,
      source: 'generated',
      meta: {
        remaining: (subCtx?.remaining || 1) - 1,
        limit: subCtx?.dailyLimit,
        estimated_cost: costEstimate.estimatedCost,
      },
    };
  }
}
