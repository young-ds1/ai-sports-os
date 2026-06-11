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
        activationRate: number;
        timeToFirstAiAction: number;
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
        velocity: number;
        health: 'critical' | 'building' | 'healthy' | 'accelerating';
        bottleneck: string;
        recommendation: string;
    };
}
export declare class RevenueFlywheelService {
    private readonly retention;
    private readonly pricingTest;
    private readonly attribution;
    private readonly logger;
    constructor(retention: RetentionEngineService, pricingTest: PricingTestService, attribution: ConversionAttributionService);
    /**
     * Generate the complete revenue flywheel dashboard.
     */
    getDashboard(): FlywheelDashboard;
    private identifyBottleneck;
    private generateRecommendation;
}
export {};
//# sourceMappingURL=revenue-flywheel.service.d.ts.map