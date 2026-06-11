/**
 * PricingTestService — A/B tests different price points to find optimal pricing.
 *
 * Pro tier test buckets:  $5/mo, $9/mo, $12/mo
 * Elite tier test buckets: $19/mo, $29/mo
 *
 * Assignment: deterministic hash of user_id → consistent price across sessions.
 * Goal: measure price elasticity — how many users convert at each price point.
 */
export interface PriceBucket {
    tier: 'pro' | 'elite';
    priceId: string;
    monthlyPrice: number;
    annualPrice: number;
    displayName: string;
    weight: number;
}
export interface PricingTestResult {
    tier: string;
    bucket: PriceBucket;
    impressions: number;
    conversions: number;
    conversionRate: number;
    revenuePerImpression: number;
    optimalPrice: boolean;
}
export declare class PricingTestService {
    private readonly logger;
    private impressions;
    private conversions;
    constructor();
    /**
     * Assign a user to a price bucket. Deterministic — same user always sees same price.
     */
    assignPrice(userId: string, tier: 'pro' | 'elite'): PriceBucket;
    /**
     * Get the pricing shown to a specific user (with annual discount displayed).
     */
    getPricingForUser(userId: string): {
        pro: {
            monthly: number;
            annual: number;
            annualMonthlyEquivalent: number;
            savingsPercent: number;
        };
        elite: {
            monthly: number;
            annual: number;
            annualMonthlyEquivalent: number;
            savingsPercent: number;
        };
    };
    /**
     * Track a conversion at a specific price point.
     */
    trackConversion(userId: string, tier: 'pro' | 'elite'): void;
    /**
     * Get complete pricing test results.
     */
    getResults(): {
        pro: PricingTestResult[];
        elite: PricingTestResult[];
        summary: string;
    };
    private bucketResults;
    private hashString;
}
//# sourceMappingURL=pricing-test.service.d.ts.map