import { MoatMetricsService, MoatAssessment } from './moat-metrics.service';
import { RevenueFlywheelService } from '../revenue/revenue-flywheel.service';
import { RetentionEngineService } from '../revenue/retention-engine.service';
import { UserUsageService } from '../users/user-usage.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PricingTestService } from '../subscriptions/pricing-test.service';
import { ConversionAttributionService } from '../subscriptions/conversion-attribution.service';
import { AutonomousLoopService } from '../autonomous/autonomous-loop.service';
import { HookOptimizerService } from '../content/factory/hook-optimizer.service';
/**
 * VCDashboardService — the single endpoint an investor needs.
 *
 * Aggregates every metric from every module into one structured
 * response that tells the complete company story.
 */
export interface VCSnapshot {
    company: {
        name: string;
        tagline: string;
        stage: string;
        founded: string;
        thesis: string;
    };
    traction: {
        dau: number;
        wau: number;
        mau: number;
        aiRequestsPerDau: number;
        d7Retention: number | null;
        d30Retention: number | null;
        totalUsers: number;
        growthRate: number;
    };
    revenue: {
        mrr: number;
        arr: number;
        arpu: number;
        arppu: number;
        ltv: number;
        payingUsers: number;
        paidConversionRate: number;
        projectedMrr6Months: number;
    };
    moat: MoatAssessment;
    flywheel: {
        health: string;
        velocity: number;
        autonomousCycles: number;
        uptime: string;
        currentObjective: string;
    };
    unitEconomics: {
        cac: number;
        ltvCacRatio: number;
        paybackMonths: number;
        grossMargin: number;
    };
    narrative: InvestmentNarrative;
}
export interface InvestmentNarrative {
    problem: string;
    solution: string;
    whyNow: string;
    traction: string;
    businessModel: string;
    marketSize: string;
    moatSummary: string;
    ask: string;
    useOfFunds: string;
}
export declare class VCDashboardService {
    private readonly moatMetrics;
    private readonly flywheel;
    private readonly retention;
    private readonly userUsage;
    private readonly subscriptions;
    private readonly pricingTest;
    private readonly attribution;
    private readonly autonomous;
    private readonly hookOptimizer;
    constructor(moatMetrics: MoatMetricsService, flywheel: RevenueFlywheelService, retention: RetentionEngineService, userUsage: UserUsageService, subscriptions: SubscriptionsService, pricingTest: PricingTestService, attribution: ConversionAttributionService, autonomous: AutonomousLoopService, hookOptimizer: HookOptimizerService);
    /**
     * Generate the complete VC-ready company snapshot.
     */
    getSnapshot(): Promise<VCSnapshot>;
    private buildNarrative;
    private projectMrr;
}
//# sourceMappingURL=vc-dashboard.service.d.ts.map