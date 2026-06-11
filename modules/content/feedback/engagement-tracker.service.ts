import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentOutput } from '../entities/content-output.entity';

interface EngagementUpdate {
  contentId: string;
  platform: string;
  metric: 'views' | 'likes' | 'shares' | 'comments' | 'clicks' | 'conversions';
  value: number;
}

interface ConversionAttribution {
  userId: string;
  contentId: string;
  utmSource: string;
  utmCampaign: string;
  convertedAt: Date;
}

@Injectable()
export class EngagementTrackerService {
  private readonly logger = new Logger(EngagementTrackerService.name);
  private conversionCache = new Map<string, ConversionAttribution[]>(); // contentId → attributions

  constructor(
    @InjectRepository(ContentOutput)
    private readonly outputRepo: Repository<ContentOutput>,
  ) {}

  /**
   * Update engagement metrics for a content output.
   * Called by webhook or manual data entry.
   */
  async updateEngagement(update: EngagementUpdate): Promise<void> {
    const output = await this.outputRepo.findOne({
      where: { content_id: update.contentId, platform: update.platform },
    });

    if (!output) {
      this.logger.warn(`[Engagement] Content not found: ${update.contentId} on ${update.platform}`);
      return;
    }

    const currentEngagement = (output.engagement || {}) as Record<string, number>;
    currentEngagement[update.metric] = update.value;

    await this.outputRepo.update(output.id, {
      engagement: currentEngagement,
    });

    this.logger.log(
      `[Engagement] ${update.platform}/${update.contentId}: ${update.metric}=${update.value}`,
    );
  }

  /**
   * Track a user conversion attributed to a specific content piece.
   */
  trackConversion(attribution: ConversionAttribution): void {
    if (!this.conversionCache.has(attribution.contentId)) {
      this.conversionCache.set(attribution.contentId, []);
    }
    this.conversionCache.get(attribution.contentId)!.push(attribution);

    // Update the content output's conversion count
    this.outputRepo
      .createQueryBuilder()
      .update(ContentOutput)
      .set({
        engagement: () => `engagement || '{"conversions": ${
          (this.conversionCache.get(attribution.contentId)?.length || 1)
        }}'::jsonb`,
      })
      .where('content_id = :contentId', { contentId: attribution.contentId })
      .execute()
      .catch(() => {}); // Fire-and-forget
  }

  /**
   * Get conversion attribution report.
   */
  getAttributionReport(days = 30): {
    by_platform: Record<string, { clicks: number; conversions: number; conversionRate: number }>;
    by_content_type: Record<string, { pieces: number; conversions: number }>;
  } {
    const byPlatform: Record<string, any> = {};
    const byType: Record<string, any> = {};

    // Aggregate from conversionCache
    for (const [contentId, attributions] of this.conversionCache) {
      for (const attr of attributions) {
        if (!byPlatform[attr.utmSource]) {
          byPlatform[attr.utmSource] = { clicks: 0, conversions: 0, conversionRate: 0 };
        }
        byPlatform[attr.utmSource].conversions++;
      }
    }

    return {
      by_platform: byPlatform,
      by_content_type: byType,
    };
  }
}
