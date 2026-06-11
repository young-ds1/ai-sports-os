import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentOutput } from '../entities/content-output.entity';
import { HookOptimizerService } from '../factory/hook-optimizer.service';
import { UserUsageService } from '../../users/user-usage.service';

interface ContentPerformanceSnapshot {
  contentId: string;
  platform: string;
  publishedAt: Date;
  ctr: number;           // clicks / impressions
  engagement: number;    // (likes*2 + shares*5 + comments*3)
  conversions: number;   // users who signed up via this content
  daysSincePublish: number;
}

@Injectable()
export class GrowthFeedbackService {
  private readonly logger = new Logger(GrowthFeedbackService.name);

  constructor(
    @InjectRepository(ContentOutput)
    private readonly outputRepo: Repository<ContentOutput>,
    private readonly hookOptimizer: HookOptimizerService,
    private readonly userUsageService: UserUsageService,
  ) {}

  /**
   * Process feedback batch:
   * 1. Pull all published content
   * 2. Calculate performance metrics
   * 3. Update hook pattern scores
   * 4. Identify winning content formulas
   */
  async processFeedbackBatch(daysBack = 7): Promise<{
    analyzed: number;
    topPerformers: ContentPerformanceSnapshot[];
    updatedPatterns: number;
    insights: string[];
  }> {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const outputs = await this.outputRepo
      .createQueryBuilder('output')
      .where('output.published_at IS NOT NULL')
      .andWhere('output.published_at >= :since', { since })
      .getMany();

    const snapshots: ContentPerformanceSnapshot[] = [];
    const insights: string[] = [];

    for (const output of outputs) {
      const engagement = output.engagement || {};
      const views = (engagement as any).views || 0;
      const clicks = (engagement as any).clicks || 0;
      const likes = (engagement as any).likes || 0;
      const shares = (engagement as any).shares || 0;
      const comments = (engagement as any).comments || 0;
      const conversions = (engagement as any).conversions || 0;

      const ctr = views > 0 ? clicks / views : 0;
      const engagementScore = likes * 2 + shares * 5 + comments * 3;
      const daysSince = output.published_at
        ? Math.max(1, Math.floor((Date.now() - new Date(output.published_at).getTime()) / 86400000))
        : 1;

      snapshots.push({
        contentId: output.content_id || output.id,
        platform: output.platform,
        publishedAt: output.published_at!,
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
    snapshots.sort((a, b) =>
      (b.engagement / b.daysSincePublish) - (a.engagement / a.daysSincePublish),
    );

    const topPerformers = snapshots.slice(0, 5);

    // Generate insights
    if (topPerformers.length > 0) {
      const best = topPerformers[0];
      insights.push(
        `🏆 最佳内容：${best.platform} 平台，CTR ${(best.ctr * 100).toFixed(1)}%，` +
        `互动 ${best.engagement}，发布 ${best.daysSincePublish} 天`,
      );
    }

    // Platform comparison
    const byPlatform: Record<string, { total: number; totalCtr: number }> = {};
    for (const s of snapshots) {
      if (!byPlatform[s.platform]) byPlatform[s.platform] = { total: 0, totalCtr: 0 };
      byPlatform[s.platform].total++;
      byPlatform[s.platform].totalCtr += s.ctr;
    }

    const bestPlatform = Object.entries(byPlatform)
      .filter(([, d]) => d.total > 0)
      .sort((a, b) => (b[1].totalCtr / b[1].total) - (a[1].totalCtr / a[1].total))[0];

    if (bestPlatform) {
      insights.push(
        `📱 最高CTR平台：${bestPlatform[0]} (${((bestPlatform[1].totalCtr / bestPlatform[1].total) * 100).toFixed(1)}%)`,
      );
    }

    // AI usage correlation
    const aiPerDau = await this.userUsageService.getAiRequestsPerDau();
    insights.push(
      `📊 当前 AI Requests/DAU: ${aiPerDau.toFixed(1)} ` +
      (aiPerDau >= 1.0 ? '✅ 需求已验证' : '⚠️ 需要更多引流'),
    );

    this.logger.log(
      `[Feedback] Analyzed ${snapshots.length} pieces | ` +
      `${topPerformers.length} top performers | ${insights.length} insights`,
    );

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
  private inferPattern(content: string, platform: string): string {
    const firstLine = content.trim().split('\n')[0] || '';

    if (/^\d/.test(firstLine)) return 'numbers-first';
    if (firstLine.includes('？') || firstLine.includes('?')) return 'question-hook';
    if (content.includes('🧵')) return 'thread-tease';
    if (firstLine.includes('暴露') || firstLine.includes('致命')) return 'hot-take';
    if ((firstLine.match(/[\u{1F000}-\u{1FFFF}]/gu) || []).length >= 3) return 'emoji-story';
    if (content.includes('数据') || content.includes('%')) return 'data-drop';
    if (content.includes('件事') || content.includes('要点')) return 'listicle-hook';

    return 'numbers-first'; // Default
  }
}
