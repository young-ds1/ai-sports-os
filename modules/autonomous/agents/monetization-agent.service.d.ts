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
export declare class MonetizationAgentService {
    private readonly pricingTest;
    private readonly paywallTrigger;
    private readonly attribution;
    private readonly flywheel;
    private readonly upgradePath;
    private readonly logger;
    private previousOptimalPrice;
    constructor(pricingTest: PricingTestService, paywallTrigger: PaywallTriggerService, attribution: ConversionAttributionService, flywheel: RevenueFlywheelService, upgradePath: UpgradePathService);
    /**
     * Analyze monetization data and optimize.
     */
    optimize(strategy: StrategyDecision, growth: GrowthAnalysis): Promise<MonetizationOptimization>;
}
//# sourceMappingURL=monetization-agent.service.d.ts.map