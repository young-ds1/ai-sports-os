import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentTask, ContentStatus, ContentType, ContentTrigger } from '../entities/content-task.entity';
import { ContentOutput } from '../entities/content-output.entity';
import { OpenaiService } from '../../ai-engine/engines/openai.service';
import { PromptBuilderService } from '../../ai-engine/engines/prompt-builder.service';
import { CostTrackerService } from '../../ai-engine/cost/cost-tracker.service';
import { MatchesService } from '../../domain/matches/matches.service';
import { XhsAdapter } from '../adapters/xiaohongshu.adapter';
import { TwitterAdapter } from '../adapters/twitter.adapter';
import { WechatAdapter } from '../adapters/wechat.adapter';
import { DouyinAdapter } from '../adapters/douyin.adapter';
import { SeoAdapter } from '../adapters/seo.adapter';
import { PlatformAdapter } from '../adapters/platform.interface';
import { UtmBuilderService } from '../distribution/utm-builder.service';
import { HookOptimizerService } from './hook-optimizer.service';
import { ExplosiveSignal } from '../signals/signal-ranker.service';
import { HotScoreResult } from '../signals/hot-score.service';

interface PlatformResult {
  platform: string;
  success: boolean;
  outputId?: string;
  error?: string;
  latencyMs: number;
}

@Injectable()
export class ContentExplosionService {
  private readonly logger = new Logger(ContentExplosionService.name);
  private platformAdapters: Map<string, PlatformAdapter>;

  constructor(
    @InjectRepository(ContentTask)
    private readonly taskRepo: Repository<ContentTask>,
    @InjectRepository(ContentOutput)
    private readonly outputRepo: Repository<ContentOutput>,
    private readonly openai: OpenaiService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly costTracker: CostTrackerService,
    private readonly matchesService: MatchesService,
    private readonly utmBuilder: UtmBuilderService,
    private readonly hookOptimizer: HookOptimizerService,
    xhsAdapter: XhsAdapter,
    twitterAdapter: TwitterAdapter,
    wechatAdapter: WechatAdapter,
    douyinAdapter: DouyinAdapter,
    seoAdapter: SeoAdapter,
  ) {
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
  @OnEvent('content.explode', { async: true })
  async onExplosiveSignal(signal: ExplosiveSignal): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `💥 [EXPLOSION] Processing: ${signal.matchData.homeTeam} vs ${signal.matchData.awayTeam} ` +
      `| tier=${signal.tier} | score=${signal.totalScore} | reason="${signal.reason}"`,
    );

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
        status: successCount > 0 ? ContentStatus.COMPLETED : ContentStatus.FAILED,
        model_version: 'gpt-4o-explosion',
        total_tokens_used: platformResults.length * 2000,
        completed_at: new Date(),
      });

      const totalMs = Date.now() - startTime;
      this.logger.log(
        `✅ [EXPLOSION] Complete: ${successCount}/${platformResults.length} platforms ` +
        `| ${totalMs}ms | task=${task.id}`,
      );
    } catch (err) {
      this.logger.error(`[EXPLOSION] Failed for ${signal.matchId}`, err);
    }
  }

  /**
   * Create the master content task for this explosion.
   */
  private async createExplosionTask(signal: ExplosiveSignal): Promise<ContentTask> {
    const contentType = this.mapSignalToContentType(signal);

    const task = this.taskRepo.create({
      trigger_type: ContentTrigger.MATCH_FINISHED,
      reference_type: 'match',
      reference_id: signal.matchId,
      content_type: contentType,
      target_platforms: ['xiaohongshu', 'twitter', 'wechat', 'douyin', 'seo'],
      status: ContentStatus.GENERATING,
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
  private mapSignalToContentType(signal: ExplosiveSignal): string {
    const goals = (signal.matchData.homeScore || 0) + (signal.matchData.awayScore || 0);

    if (signal.matchData.hasComeback || signal.matchData.lateDramaMinutes! >= 90) {
      return ContentType.HOT_TAKE;
    }
    if (goals >= 5) return ContentType.HOT_TAKE;
    if (signal.matchData.isPenaltyShootout) return ContentType.POST_MATCH;
    if (signal.tier === 'nuclear') return ContentType.POST_MATCH;
    return ContentType.POST_MATCH;
  }

  /**
   * Generate AI content with hook optimization.
   * The prompt is enhanced by:
   * - HotScore reason (why this match matters)
   * - Best-performing hook patterns from feedback data
   */
  private async generateContent(signal: ExplosiveSignal, task: ContentTask): Promise<string> {
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
  private async explodeToPlatforms(
    task: ContentTask,
    signal: ExplosiveSignal,
    rawContent: string,
  ): Promise<PlatformResult[]> {
    const contentId = `explode_${signal.matchId.substring(0, 8)}_${Date.now()}`;
    const platforms = task.target_platforms;

    // Parallel explosion
    const results = await Promise.allSettled(
      platforms.map(async (platform): Promise<PlatformResult> => {
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
        } catch (err: any) {
          this.logger.error(`[EXPLOSION] ${platform} adapter failed: ${err.message}`);
          return { platform, success: false, error: err.message, latencyMs: Date.now() - t0 };
        }
      }),
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { platform: platforms[i], success: false, error: 'Promise rejected', latencyMs: 0 },
    );
  }
}
