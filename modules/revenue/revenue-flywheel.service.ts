import { Injectable, Logger } from '@nestjs/common';
import { RetentionEngineService } from './retention-engine.service';
import { PricingTestService } from '../subscriptions/pricing-test.service';
import { ConversionAttributionService } from '../subscriptions/conversion-attribution.service';

/**
 * RevenueFlywheelService — measures the health of the full revenue flywheel.
 *
 * Flywheel stages:
 *   Acquisition → Activation → Retention → Revenue → Referral
 *
 * Metrics tracked:
 * - ARPU (Average Revenue Per User)
 * - ARPPU (Average Revenue Per PAYING User)
 * - LTV (Lifetime Value estimate)
 * - MRR (Monthly Recurring Revenue estimate)
 * - Flywheel velocity ratio (new subscribers / churned)
 * - Upgrade rate (Free→Pro, Pro→Elite)
 */

interface FlywheelDashboard {
  timestamp: string;
  acquisition: {
    newUsersToday: number;
    newUsersThisWeek: number;
    topAcquisitionSource: string;
  };
  activation: {
    activationRate: number;       // % who do 1+ AI action
    timeToFirstAiAction: number;  // minutes
    aiRequestsPerDau: number;
  };
  retention: {
    d7: number | null;
    d30: number | null;
    dau: number;
    churnRiskCount: number;
  };
  revenue: {
    estimatedMrr: number;
    estimatedArr: number;
    arpu: number;
    arppu: number;
    ltv: number;
    payingUsers: number;
    totalUsers: number;
    paidConversionRate: number;
  };
  flywheel: {
    velocity: number;             // >1 = growing, <1 = shrinking
    health: 'critical' | 'building' | 'healthy' | 'accelerating';
    bottleneck: string;
    recommendation: string;
  };
}

@Injectable()
export class RevenueFlywheelService {
  private readonly logger = new Logger(RevenueFlywheelService.name);

  constructor(
    private readonly retention: RetentionEngineService,
    private readonly pricingTest: PricingTestService,
    private readonly attribution: ConversionAttributionService,
  ) {}

  /**
   * Generate the complete revenue flywheel dashboard.
   */
  getDashboard(): FlywheelDashboard {
    const overview = this.retention.getOverview();
    const pricing = this.pricingTest.getResults();
    const attr = this.attribution.getAttributionReport();

    // Revenue estimates
    const totalUsers = overview.totalTrackedUsers || 100;
    const payingUsers = pricing.pro.reduce((s, r) => s + r.conversions, 0) +
      pricing.elite.reduce((s, r) => s + r.conversions, 0);
    const paidRate = totalUsers > 0 ? payingUsers / totalUsers : 0;

    // ARPU = total revenue / total users
    const proRevenue = pricing.pro.reduce((s, r) => s + r.conversions * r.bucket.monthlyPrice, 0);
    const eliteRevenue = pricing.elite.reduce((s, r) => s + r.conversions * r.bucket.monthlyPrice, 0);
    const totalMrr = proRevenue + eliteRevenue;
    const arpu = totalUsers > 0 ? totalMrr / totalUsers : 0;
    const arppu = payingUsers > 0 ? totalMrr / payingUsers : 0;

    // LTV = ARPU × avg lifetime (months). Conservative: 6 months for early stage.
    const avgLifetimeMonths = overview.d30 && overview.d30 > 0 ? Math.min(12, Math.max(3, 100 / (100 - overview.d30) * 1.5)) : 6;
    const ltv = arpu * avgLifetimeMonths;

    // Flywheel velocity
    const velocity = payingUsers > 0 ? (payingUsers / Math.max(overview.churnRiskCount, 1)) : 0;

    // Health assessment
    let health: FlywheelDashboard['flywheel']['health'];
    if (velocity >= 3 && overview.d7 && overview.d7 >= 30) health = 'accelerating';
    else if (velocity >= 1.5 && overview.d7 && overview.d7 >= 20) health = 'healthy';
    else if (velocity >= 0.5) health = 'building';
    else health = 'critical';

    // Find the bottleneck
    const bottleneck = this.identifyBottleneck({ overview, velocity, paidRate, arpu });

    return {
      timestamp: new Date().toISOString(),
      acquisition: {
        newUsersToday: overview.dau,
        newUsersThisWeek: overview.dau * 7, // Rough estimate
        topAcquisitionSource: attr.top_conversion_path || 'organic',
      },
      activation: {
        activationRate: totalUsers > 0 ? Math.min(100, Math.round((overview.dau / totalUsers) * 100)) : 0,
        timeToFirstAiAction: 0,
        aiRequestsPerDau: 0,
      },
      retention: {
        d7: overview.d7Retention,
        d30: overview.d30Retention,
        dau: overview.dau,
        churnRiskCount: overview.churnRiskCount,
      },
      revenue: {
        estimatedMrr: Math.round(totalMrr),
        estimatedArr: Math.round(totalMrr * 12),
        arpu: Math.round(arpu * 100) / 100,
        arppu: Math.round(arppu * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        payingUsers,
        totalUsers,
        paidConversionRate: Math.round(paidRate * 10000) / 100,
      },
      flywheel: {
        velocity: Math.round(velocity * 100) / 100,
        health,
        bottleneck,
        recommendation: this.generateRecommendation(health, bottleneck),
      },
    };
  }

  private identifyBottleneck(metrics: any): string {
    const { overview, velocity, paidRate } = metrics;
    if (overview.d7Retention && overview.d7Retention < 15) return 'retention';
    if (overview.dau < 10) return 'acquisition';
    if (paidRate < 0.01) return 'conversion';
    if (velocity < 1) return 'churn';
    return 'scale'; // Everything working — need more volume
  }

  private generateRecommendation(health: string, bottleneck: string): string {
    const map: Record<string, string> = {
      retention: '用户来了就走。优先优化 D7 留存：增加 daily AI digest + streak 机制',
      acquisition: '用户不够。加大内容分发力度（STEP 7-8），增加外部流量入口',
      conversion: '看了不买。强化决策价值定位，增加 prediction preview 展示频率',
      churn: '买了又走。对流失用户发送 personalized re-engagement nudge',
      scale: '飞轮运转正常。加大获客投入，扩大规模',
    };
    return map[bottleneck] || '继续监控飞轮指标';
  }
}
