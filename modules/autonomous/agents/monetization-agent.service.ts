import { Injectable, Logger } from '@nestjs/common';
import { PricingTestService } from '../../subscriptions/pricing-test.service';
import { PaywallTriggerService } from '../../subscriptions/paywall-trigger.service';
import { ConversionAttributionService } from '../../subscriptions/conversion-attribution.service';
import { RevenueFlywheelService } from '../../revenue/revenue-flywheel.service';
import { UpgradePathService } from '../../revenue/upgrade-path.service';
import { StrategyDecision } from './strategy-agent.service';
import { GrowthAnalysis } from './growth-agent.service';

/**
 * MonetizationAgent — autonomous revenue optimization.
 *
 * Decides:
 * - Which price point is winning the A/B test?
 * - Should we shift more traffic to the winning bucket?
 * - Which paywall trigger drives the most conversions?
 * - What upgrade path should we push harder?
 *
 * No human sets prices or paywall rules.
 */

export interface MonetizationOptimization {
  timestamp: Date;
  pricing: {
    proOptimalPrice: number;
    eliteOptimalPrice: number;
    recommendation: string;
    actionTaken: string;
  };
  paywall: {
    topTrigger: string;
    topTriggerConversionRate: number;
    underperformingTrigger: string | null;
    recommendation: string;
  };
  upgradePath: {
    strongestPath: string;
    weakestPath: string;
    recommendation: string;
  };
  revenueProjection: {
    currentMrr: number;
    projectedMrrNextMonth: number;
    growthRate: number;
  };
  summary: string;
}

@Injectable()
export class MonetizationAgentService {
  private readonly logger = new Logger(MonetizationAgentService.name);
  private previousOptimalPrice: Record<string, number> = {};

  constructor(
    private readonly pricingTest: PricingTestService,
    private readonly paywallTrigger: PaywallTriggerService,
    private readonly attribution: ConversionAttributionService,
    private readonly flywheel: RevenueFlywheelService,
    private readonly upgradePath: UpgradePathService,
  ) {}

  /**
   * Analyze monetization data and optimize.
   */
  async optimize(
    strategy: StrategyDecision,
    growth: GrowthAnalysis,
  ): Promise<MonetizationOptimization> {
    const dashboard = this.flywheel.getDashboard();
    const pricingResults = this.pricingTest.getResults();
    const attributionReport = this.attribution.getAttributionReport();

    // ── Pricing optimization ──
    const bestPro = pricingResults.pro.find(r => r.optimalPrice);
    const bestElite = pricingResults.elite.find(r => r.optimalPrice);
    const proPrice = bestPro?.bucket.monthlyPrice || 9;
    const elitePrice = bestElite?.bucket.monthlyPrice || 29;

    let pricingAction = 'maintain';
    if (this.previousOptimalPrice['pro'] && proPrice !== this.previousOptimalPrice['pro']) {
      pricingAction = `Pro 最优价格从 $${this.previousOptimalPrice['pro']} 变为 $${proPrice}`;
    }
    this.previousOptimalPrice = { pro: proPrice, elite: elitePrice };

    // ── Paywall optimization ──
    const topFeature = Object.entries(attributionReport.by_feature)
      .sort((a, b) => b[1].conversions - a[1].conversions)[0];
    const worstFeature = Object.entries(attributionReport.by_feature)
      .sort((a, b) => a[1].conversions - b[1].conversions)[0];

    // ── Upgrade path assessment ──
    const samplePath = this.upgradePath.evaluate('sample-user', {
      tier: 'free',
      todayAnalysisCount: 3,
      dailyLimit: 3,
      consecutiveQuestions: 0,
      hasAskedPrediction: false,
      hasViewedKeyMatch: false,
      streak: 0,
    });

    const strongestPath = samplePath.paths.sort((a, b) => b.progress - a.progress)[0];

    // ── Revenue projection ──
    const currentMrr = dashboard.revenue.estimatedMrr;
    const growthRate = pricingResults.pro.reduce((s, r) => s + r.conversions, 0) > 0
      ? 0.15  // Growing: assume 15% monthly
      : 0.05;  // Early: assume 5%

    const summary = [
      `Pro 最优价格: $${proPrice}/月`,
      topFeature ? `最强转化功能: ${topFeature[0]} (${topFeature[1].conversions}次)` : '暂无转化数据',
      `当前 MRR: $${currentMrr}`,
      `下月预估 MRR: $${Math.round(currentMrr * (1 + growthRate))}`,
    ].join(' | ');

    const optimization: MonetizationOptimization = {
      timestamp: new Date(),
      pricing: {
        proOptimalPrice: proPrice,
        eliteOptimalPrice: elitePrice,
        recommendation: `继续 A/B 测试。Pro $${proPrice}/月表现最优。`,
        actionTaken: pricingAction,
      },
      paywall: {
        topTrigger: topFeature?.[0] || 'unknown',
        topTriggerConversionRate: topFeature?.[1]?.percent || 0,
        underperformingTrigger: worstFeature?.[0] !== topFeature?.[0] ? worstFeature?.[0] : null,
        recommendation: topFeature
          ? `强化 "${topFeature[0]}" 触发展示频率`
          : '等待更多转化数据',
      },
      upgradePath: {
        strongestPath: strongestPath?.id || 'unknown',
        weakestPath: samplePath.paths.sort((a, b) => a.progress - b.progress)[0]?.id || 'unknown',
        recommendation: strongestPath?.triggered
          ? `${strongestPath.id} 已触发 — 加大该路径的升级提示`
          : `优先推进 ${strongestPath?.id} 路径`,
      },
      revenueProjection: {
        currentMrr,
        projectedMrrNextMonth: Math.round(currentMrr * (1 + growthRate)),
        growthRate: Math.round(growthRate * 100),
      },
      summary,
    };

    this.logger.log(`[MonetizationAgent] ${summary}`);
    return optimization;
  }
}
