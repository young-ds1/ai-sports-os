import { Controller, Get, Param, Req } from '@nestjs/common';
import { AnalysisService } from '../../../../modules/ai-engine/analysis/analysis.service';
import { AiCacheService } from '../../../../modules/ai-engine/cache/ai-cache.service';
import { OpenaiService } from '../../../../modules/ai-engine/engines/openai.service';
import { PromptBuilderService } from '../../../../modules/ai-engine/engines/prompt-builder.service';
import { MatchesService } from '../../../../modules/domain/matches/matches.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/ai/analysis')
export class AiAnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly cacheService: AiCacheService,
    private readonly openai: OpenaiService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly matchesService: MatchesService,
  ) {}

  @Get(':matchId')
  @Public()
  async getAnalysis(@Param('matchId') matchId: string) {
    // Step 1: Check Redis cache
    const cached = await this.cacheService.getAnalysis(matchId);
    if (cached) {
      return { data: cached, source: 'cache' };
    }

    // Step 2: Check database
    const existing = await this.analysisService.getByMatch(matchId);
    if (existing) {
      // Refresh cache
      await this.cacheService.setAnalysis(matchId, existing.content);
      return { data: existing.content, source: 'database' };
    }

    // Step 3: Generate new analysis (fallback — normally pre-generated)
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

    const content = { summary: result.answer, generated_at: new Date().toISOString() };

    // Save to database
    await this.analysisService.create({
      match_id: matchId,
      analysis_type: match.status === 'finished' ? 'post_match' : 'pre_match',
      content,
      model_version: result.model,
      tokens_used: result.tokensUsed,
      confidence_score: 75,
      input_context: { match_id: matchId },
      expires_at: new Date(Date.now() + 24 * 3600 * 1000),
    });

    // Cache
    await this.cacheService.setAnalysis(matchId, content);

    return { data: content, source: 'generated' };
  }
}
