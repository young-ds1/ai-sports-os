import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentTask, ContentStatus } from '../entities/content-task.entity';
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
import { UtmBuilderService } from '../distribution/utm-builder.service';
import { PlatformAdapter, PLATFORM_ADAPTERS } from '../adapters/platform.interface';

interface CreateTaskParams {
  trigger_type: string;
  reference_type: string;
  reference_id: string;
  content_type: string;
  target_platforms: string[];
  priority: number;
  input_context: Record<string, any>;
}

@Injectable()
export class ContentFactoryService {
  private readonly logger = new Logger(ContentFactoryService.name);
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
    private readonly xhsAdapter: XhsAdapter,
    private readonly twitterAdapter: TwitterAdapter,
    private readonly wechatAdapter: WechatAdapter,
    private readonly douyinAdapter: DouyinAdapter,
    private readonly seoAdapter: SeoAdapter,
  ) {
    this.platformAdapters = new Map([
      ['xiaohongshu', xhsAdapter],
      ['twitter', twitterAdapter],
      ['wechat', wechatAdapter],
      ['douyin', douyinAdapter],
      ['seo', seoAdapter],
    ]);
  }

  async createTask(params: CreateTaskParams): Promise<ContentTask> {
    const task = this.taskRepo.create({
      trigger_type: params.trigger_type,
      reference_type: params.reference_type,
      reference_id: params.reference_id,
      content_type: params.content_type,
      target_platforms: params.target_platforms,
      status: ContentStatus.PENDING,
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

  async generateForTask(task: ContentTask): Promise<void> {
    this.logger.log(`[Factory] Generating task=${task.id} type=${task.content_type} platforms=${task.target_platforms}`);

    // Mark as generating
    await this.taskRepo.update(task.id, { status: ContentStatus.GENERATING });

    try {
      // 1. Build AI prompt based on content type and context
      const match = task.reference_id
        ? await this.matchesService.findById(task.reference_id).catch(() => null)
        : null;

      const systemPrompt = this.buildContentPrompt(task, match);

      // 2. Generate base content via LLM
      const cost = this.costTracker.estimateCall({
        tier: 'vip',  // Content generation uses system-tier budget
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
        if (!adapter) continue;

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
        status: ContentStatus.COMPLETED,
        model_version: result.model,
        total_tokens_used: totalTokens,
        completed_at: new Date(),
      });
    } catch (err) {
      this.logger.error(`Content generation failed for task=${task.id}`, err);
      await this.taskRepo.update(task.id, { status: ContentStatus.FAILED });
    }
  }

  private buildContentPrompt(task: ContentTask, match: any): string {
    const base = `You are a viral sports content creator for AI Sports OS.
Write engaging, authentic content in Chinese (zh-CN).
Match the platform's native style — don't write generic articles.
Include emojis naturally. Use data points but stay conversational.
NEVER fabricate scores or stats. If data is missing, omit it.`;

    const typeInstructions: Record<string, string> = {
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

  private buildUserPrompt(task: ContentTask, match: any): string {
    const ctx = task.input_context;
    const parts: string[] = [];

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
        .filter((e: any) => e.type === 'goal')
        .map((e: any) => `${e.minute}' ${e.comment || ''}`)
        .join(', ');
      if (goals) parts.push(`GOALS: ${goals}`);
    }

    return parts.join('\n');
  }
}
