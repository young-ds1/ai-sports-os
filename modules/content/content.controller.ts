import { Controller, Get, Post, Param, Query, Body, Redirect, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContentService } from './content.service';
import { ContentFactoryService } from './factory/content-factory.service';
import { DistributionService } from './distribution/distribution.service';
import { EngagementTrackerService } from './feedback/engagement-tracker.service';
import { GrowthAnalyticsService } from './feedback/growth-analytics.service';
import { GrowthFeedbackService } from './feedback/growth-feedback.service';
import { HookOptimizerService } from './factory/hook-optimizer.service';
import { SignalRankerService } from './signals/signal-ranker.service';
import { ContentTrigger, ContentType } from './entities/content-task.entity';
import { Public } from '../../shared/decorators/public.decorator';

@Controller('api/content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly contentFactory: ContentFactoryService,
    private readonly distributionService: DistributionService,
    private readonly engagementTracker: EngagementTrackerService,
    private readonly growthAnalytics: GrowthAnalyticsService,
    private readonly growthFeedback: GrowthFeedbackService,
    private readonly hookOptimizer: HookOptimizerService,
    private readonly signalRanker: SignalRankerService,
  ) {}

  // ── Task Management ──

  @Get('tasks')
  @Public()
  async getTasks(@Query('status') status?: string) {
    return this.contentService.getTasks(status);
  }

  @Get('tasks/:id/outputs')
  @Public()
  async getTaskOutputs(@Param('id') id: string) {
    return this.contentService.getOutputs(id);
  }

  @Post('tasks/:id/retry')
  @Public()
  async retryTask(@Param('id') id: string) {
    await this.contentService.retryTask(id);
    return { status: 'ok', message: 'Task requeued for generation' };
  }

  // ── Manual Content Creation ──

  @Post('generate')
  @Public()
  async manualGenerate(@Body() body: {
    reference_type: string;
    reference_id: string;
    content_type: string;
    platforms: string[];
    context?: Record<string, any>;
  }) {
    const task = await this.contentFactory.createTask({
      trigger_type: ContentTrigger.MANUAL,
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

  @Get('pending')
  @Public()
  async getPendingPublish(@Query('platform') platform?: string) {
    return this.distributionService.getPendingOutputs(platform);
  }

  @Post('publish')
  @Public()
  async recordPublish(@Body() body: {
    outputId: string;
    platform: string;
    publishedUrl?: string;
  }) {
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

  @Post('engagement')
  @Public()
  async updateEngagement(@Body() body: {
    contentId: string;
    platform: string;
    metric: string;
    value: number;
  }) {
    await this.engagementTracker.updateEngagement({
      contentId: body.contentId,
      platform: body.platform,
      metric: body.metric as any,
      value: body.value,
    });
    return { status: 'ok' };
  }

  // ── Feedback Loop (STEP 8) ──

  @Post('feedback/process')
  @Public()
  async processFeedback(@Query('days') days = 7) {
    const result = await this.growthFeedback.processFeedbackBatch(days);
    return { data: result };
  }

  @Get('feedback/top-performers')
  @Public()
  async getTopPerformers(@Query('days') days = 7) {
    const result = await this.growthFeedback.processFeedbackBatch(days);
    return {
      data: result.topPerformers,
      insights: result.insights,
    };
  }

  // ── Hook Optimizer (STEP 8) ──

  @Get('hooks')
  @Public()
  async getHookPatterns(@Query('platform') platform?: string) {
    if (platform) {
      return { data: this.hookOptimizer.getBestForPlatform(platform, 10) };
    }
    return { data: this.hookOptimizer.getAllPatterns() };
  }

  // ── Signal Ranker (STEP 8) ──

  @Get('ranker/status')
  @Public()
  async getRankerStatus() {
    return { data: this.signalRanker.getStatus() };
  }

  // ── Growth Dashboard ──

  @Get('growth')
  @Public()
  async getGrowthDashboard(@Query('days') days = 7) {
    return this.growthAnalytics.getGrowthDashboard(days);
  }

  @Get('performance')
  @Public()
  async getContentPerformance(@Query('days') days = 7) {
    return this.distributionService.getContentPerformance(days);
  }

  // ── UTM Public Tracking Endpoint (Growth Loop) ──
  // GET /api/content/track?utm_source=xiaohongshu&utm_medium=content&utm_content=explode_abc123&utm_campaign=post_match_2026-06-12&ref=match-003
  // Records the click, then redirects to the target page.

  @Get('track')
  @Public()
  async trackUtmClick(
    @Query('utm_source') utmSource: string,
    @Query('utm_medium') utmMedium: string,
    @Query('utm_campaign') utmCampaign: string,
    @Query('utm_content') utmContent: string,
    @Query('utm_term') utmTerm: string,
    @Query('ref') ref: string,
    @Res() res: Response,
  ) {
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
    }).catch(() => {});

    // Track the attribution event for conversion funnel
    if (ref) {
      this.engagementTracker.updateEngagement({
        contentId,
        platform,
        metric: 'views',
        value: 1,
      }).catch(() => {});
    }

    // Build redirect target
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    let redirectUrl = `${appUrl}/`;

    if (ref && ref.startsWith('match-')) {
      redirectUrl = `${appUrl}/matches/${ref}`;
    }

    // Append UTM params to target for client-side tracking
    const params = new URLSearchParams();
    if (utmSource) params.set('utm_source', utmSource);
    if (utmMedium) params.set('utm_medium', utmMedium);
    if (utmCampaign) params.set('utm_campaign', utmCampaign);
    if (utmContent) params.set('utm_content', utmContent);
    if (utmTerm) params.set('utm_term', utmTerm);

    const finalUrl = `${redirectUrl}?${params.toString()}`;
    return res.redirect(302, finalUrl);
  }
}
