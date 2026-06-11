import { Injectable } from '@nestjs/common';
import { DistributionService } from '../distribution/distribution.service';
import { EngagementTrackerService } from './engagement-tracker.service';
import { UserUsageService } from '../../users/user-usage.service';

export interface GrowthDashboard {
  period: { start: string; end: string };
  content: {
    total_generated: number;
    total_published: number;
    publish_rate: number;
    by_platform: Record<string, any>;
  };
  traffic: {
    estimated_clicks: number;
    estimated_conversions: number;
    conversion_rate: number;
  };
  growth: {
    new_users: number;
    returning_users: number;
    dau_trend: 'up' | 'down' | 'flat';
    ai_requests_per_dau: number;
  };
  recommendation: string;
}

@Injectable()
export class GrowthAnalyticsService {
  constructor(
    private readonly distributionService: DistributionService,
    private readonly engagementTracker: EngagementTrackerService,
    private readonly userUsageService: UserUsageService,
  ) {}

  /**
   * Generate a complete growth dashboard.
   */
  async getGrowthDashboard(days = 7): Promise<GrowthDashboard> {
    const performance = await this.distributionService.getContentPerformance(days);
    const attribution = this.engagementTracker.getAttributionReport(days);
    const dau = await this.userUsageService.getDailyActiveUsers();
    const aiPerDau = await this.userUsageService.getAiRequestsPerDau();

    // Calculate total clicks from engagement data
    let totalClicks = 0;
    let totalConversions = 0;
    for (const [, data] of Object.entries(attribution.by_platform)) {
      totalClicks += data.clicks || 0;
      totalConversions += data.conversions || 0;
    }

    // Growth recommendation engine
    const recommendation = this.generateRecommendation({
      publishRate: performance.total_outputs > 0
        ? performance.published / performance.total_outputs
        : 0,
      aiPerDau,
      conversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
      days,
    });

    return {
      period: {
        start: new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      content: {
        total_generated: performance.total_outputs,
        total_published: performance.published,
        publish_rate: performance.total_outputs > 0
          ? Math.round((performance.published / performance.total_outputs) * 100)
          : 0,
        by_platform: performance.by_platform,
      },
      traffic: {
        estimated_clicks: totalClicks,
        estimated_conversions: totalConversions,
        conversion_rate: totalClicks > 0
          ? Math.round((totalConversions / totalClicks) * 10000) / 100
          : 0,
      },
      growth: {
        new_users: 0, // Phase 3: track via user.created_at
        returning_users: dau,
        dau_trend: 'flat',
        ai_requests_per_dau: Math.round(aiPerDau * 100) / 100,
      },
      recommendation,
    };
  }

  private generateRecommendation(metrics: {
    publishRate: number;
    aiPerDau: number;
    conversionRate: number;
    days: number;
  }): string {
    const issues: string[] = [];

    if (metrics.publishRate < 0.5) {
      issues.push('内容发布率偏低，建议增加分发频率或自动化发布');
    }
    if (metrics.aiPerDau < 0.5) {
      issues.push('AI 使用率未达标，优化内容中的 CTA 引导用户尝试 AI 分析');
    }
    if (metrics.conversionRate < 0.02 && metrics.days > 7) {
      issues.push('转化率低，检查落地页体验和 UTM 追踪准确性');
    }

    if (issues.length === 0) {
      return '增长系统运行正常。继续扩大内容产出量，测试新的内容类型。';
    }

    return issues.join('；');
  }
}
