import { Injectable, Logger } from '@nestjs/common';
import { GrowthFeedbackService } from '../../content/feedback/growth-feedback.service';
import { HookOptimizerService } from '../../content/factory/hook-optimizer.service';
import { EngagementTrackerService } from '../../content/feedback/engagement-tracker.service';
import { RevenueFlywheelService } from '../../revenue/revenue-flywheel.service';
import { StrategyDecision } from './strategy-agent.service';
import { ContentAgentReport } from './content-agent.service';
import { DistributionReport } from './distribution-agent.service';

/**
 * GrowthAgent — autonomous growth analysis & optimization.
 *
 * Reads CTR, engagement, and conversion data.
 * Recommends what to change for the NEXT strategy cycle.
 * Feeds insights back to StrategyAgent via feedback loop.
 */

export interface GrowthAnalysis {
  timestamp: Date;
  contentPerformance: {
    topPlatform: string;
    topHook: string;
    avgCtr: number;
    avgEngagement: number;
  };
  conversionFunnel: {
    impressions: number;
    clicks: number;
    signups: number;
    aiUsers: number;
    payingUsers: number;
    overallConversionRate: number;
  };
  whatImproved: string[];
  whatDeclined: string[];
  recommendations: string[];
  priorityAction: string;
}

@Injectable()
export class GrowthAgentService {
  private readonly logger = new Logger(GrowthAgentService.name);
  private previousMetrics: Record<string, number> = {};

  constructor(
    private readonly growthFeedback: GrowthFeedbackService,
    private readonly hookOptimizer: HookOptimizerService,
    private readonly engagementTracker: EngagementTrackerService,
    private readonly flywheel: RevenueFlywheelService,
  ) {}

  /**
   * Analyze growth data and produce actionable recommendations.
   */
  async analyze(
    strategy: StrategyDecision,
    contentReport: ContentAgentReport,
    distributionReport: DistributionReport,
  ): Promise<GrowthAnalysis> {
    // Gather data
    const feedback = await this.growthFeedback.processFeedbackBatch(3);
    const dashboard = this.flywheel.getDashboard();
    const bestHooks = this.hookOptimizer.getBestPatterns(3);

    // Content performance
    const topHook = bestHooks[0];
    const contentPerformance = {
      topPlatform: feedback.topPerformers[0]?.platform || 'unknown',
      topHook: topHook?.pattern || 'unknown',
      avgCtr: feedback.topPerformers[0]?.ctr || 0,
      avgEngagement: feedback.topPerformers[0]?.engagement || 0,
    };

    // Conversion funnel
    const funnel = {
      impressions: distributionReport.totalPending + distributionReport.totalPublished,
      clicks: feedback.topPerformers.reduce((s, p) => s + (p.engagement || 0), 0),
      signups: dashboard.acquisition.newUsersToday,
      aiUsers: dashboard.retention.dau,
      payingUsers: dashboard.revenue.payingUsers,
      overallConversionRate: dashboard.revenue.paidConversionRate,
    };

    // Detect what's improving vs declining
    const whatImproved: string[] = [];
    const whatDeclined: string[] = [];

    const currentMetrics: Record<string, number> = {
      ctr: contentPerformance.avgCtr,
      engagement: contentPerformance.avgEngagement,
      dau: dashboard.retention.dau,
      conversion: dashboard.revenue.paidConversionRate,
      mrr: dashboard.revenue.estimatedMrr,
    };

    for (const [key, value] of Object.entries(currentMetrics)) {
      const prev = this.previousMetrics[key];
      if (prev !== undefined) {
        const change = ((value - prev) / Math.max(prev, 0.01)) * 100;
        if (change > 10) whatImproved.push(`${key} +${Math.round(change)}%`);
        else if (change < -10) whatDeclined.push(`${key} ${Math.round(change)}%`);
      }
    }
    this.previousMetrics = currentMetrics;

    // Recommendations
    const recommendations: string[] = [];

    if (contentPerformance.avgCtr < 0.03) {
      recommendations.push(`CTR 偏低 (${(contentPerformance.avgCtr * 100).toFixed(1)}%)。尝试更激进的 hook（当前最佳: ${topHook?.id}）`);
    }

    if (funnel.payingUsers === 0 && funnel.aiUsers > 10) {
      recommendations.push('有 AI 用户但无付费转化。强化 prediction preview 并在回答后立即展示 CTA');
    }

    if (whatDeclined.length > whatImproved.length) {
      recommendations.push('多个指标下滑。建议下一周期切换 primaryObjective 优先修复问题');
    }

    if (recommendations.length === 0) {
      recommendations.push('所有指标稳定或上升。扩大内容产出量，加速增长。');
    }

    // Priority action
    const priorityAction = dashboard.flywheel.bottleneck === 'acquisition'
      ? 'Increase content distribution volume on Twitter/X and 小红书'
      : dashboard.flywheel.bottleneck === 'conversion'
      ? 'Add prediction preview to all Free user analysis responses'
      : dashboard.flywheel.bottleneck === 'retention'
      ? 'Activate daily AI digest push notifications'
      : 'Scale content production — the flywheel is working';

    return {
      timestamp: new Date(),
      contentPerformance,
      conversionFunnel: funnel,
      whatImproved,
      whatDeclined,
      recommendations,
      priorityAction,
    };
  }
}
