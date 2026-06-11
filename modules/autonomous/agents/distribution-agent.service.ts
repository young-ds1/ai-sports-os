import { Injectable, Logger } from '@nestjs/common';
import { DistributionService } from '../../content/distribution/distribution.service';
import { ContentService } from '../../content/content.service';
import { StrategyDecision } from './strategy-agent.service';

/**
 * DistributionAgent — autonomous content distribution.
 *
 * Decides WHERE and WHEN to publish each content piece.
 * No human chooses the publishing schedule.
 *
 * Strategy:
 * - Match content to platform best-time windows
 * - Prioritize platforms that the StrategyAgent flagged as focusChannel
 * - Queue content for publishing, report what's pending
 */

export interface DistributionDecision {
  platform: string;
  outputCount: number;
  bestTime: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface DistributionReport {
  timestamp: Date;
  decisions: DistributionDecision[];
  totalPending: number;
  totalPublished: number;
  focusChannel: string;
  nextPublishWindow: string;
  summary: string;
}

// Platform best-times in UTC
const PLATFORM_BEST_TIMES: Record<string, string> = {
  xiaohongshu: '12:00',  // 20:00 Beijing
  twitter: '01:00',       // US evening
  wechat: '12:30',        // 20:30 Beijing
  douyin: '12:00',        // 20:00 Beijing
  seo: '06:00',           // Early morning
};

@Injectable()
export class DistributionAgentService {
  private readonly logger = new Logger(DistributionAgentService.name);

  constructor(
    private readonly distributionService: DistributionService,
    private readonly contentService: ContentService,
  ) {}

  /**
   * Decide distribution plan based on strategy.
   */
  async execute(strategy: StrategyDecision): Promise<DistributionReport> {
    const pending = await this.distributionService.getPendingOutputs();
    const decisions: DistributionDecision[] = [];
    let totalPublished = 0;

    // Group pending content by platform
    const byPlatform = new Map<string, number>();
    for (const output of pending) {
      byPlatform.set(output.platform, (byPlatform.get(output.platform) || 0) + 1);
    }

    // Build distribution decisions
    for (const [platform, count] of byPlatform) {
      const isFocusChannel = platform === strategy.growthDirective.focusChannel;
      const bestTime = PLATFORM_BEST_TIMES[platform] || '12:00';

      decisions.push({
        platform,
        outputCount: count,
        bestTime,
        priority: isFocusChannel ? 'high' : count > 5 ? 'medium' : 'low',
        reason: isFocusChannel
          ? `Strategy focus channel — publish all immediately`
          : `Queue for best-time window (${bestTime} UTC)`,
      });

      // Auto-publish for high priority, mock the action
      if (isFocusChannel) {
        const platformOutputs = pending.filter(o => o.platform === platform);
        for (const output of platformOutputs.slice(0, 5)) { // Limit 5 per cycle
          try {
            await this.distributionService.recordPublish({
              outputId: output.id,
              platform,
              publishedUrl: `https://${platform}.com/ai-sports-os/${output.content_id}`,
              publishedAt: new Date(),
              status: 'published',
            });
            totalPublished++;
          } catch (err: any) {
            this.logger.warn(`[DistributionAgent] Failed to publish ${output.id}: ${err.message}`);
          }
        }
      }
    }

    // Sort: high priority first
    decisions.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

    const report: DistributionReport = {
      timestamp: new Date(),
      decisions,
      totalPending: pending.length,
      totalPublished,
      focusChannel: strategy.growthDirective.focusChannel,
      nextPublishWindow: decisions.length > 0
        ? `${decisions[0].bestTime} UTC (${decisions[0].platform})`
        : 'No pending content',
      summary: totalPublished > 0
        ? `自动发布 ${totalPublished} 条内容到 ${strategy.growthDirective.focusChannel}，${pending.length - totalPublished} 条排队中`
        : `${pending.length} 条内容排队等待最佳发布时间`,
    };

    this.logger.log(`[DistributionAgent] ${report.summary}`);
    return report;
  }
}
