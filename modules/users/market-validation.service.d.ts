import { UserUsageService } from './user-usage.service';
/**
 * MarketValidationService — measurement only. No new features.
 *
 * Answers: "Is there real demand?"
 *
 * STEP 2: Funnel — visitors → match views → AI clicks → chat → paywall → upgrade → payments
 * STEP 3: Retention — D1 / D3 / D7 / D14
 * STEP 4: Payment validation — paywall → upgrade → checkout → payment
 * STEP 5: Content attribution — which platform/content brings users
 * STEP 6: North Star monitoring
 * STEP 7: Weekly report
 */
export interface FunnelStage {
    stage: string;
    description: string;
    count: number;
    dropOff: number;
    conversionRate: number;
    overallRate: number;
}
export interface FunnelReport {
    period: {
        start: string;
        end: string;
    };
    stages: FunnelStage[];
    totalVisitors: number;
    totalPayments: number;
    overallConversion: number;
}
export interface RetentionCohort {
    cohortDate: string;
    cohortSize: number;
    day1: number;
    day3: number;
    day7: number;
    day14: number;
    day1Rate: number;
    day3Rate: number;
    day7Rate: number;
    day14Rate: number;
}
export interface PaymentFunnel {
    paywallViewed: number;
    upgradeClicked: number;
    checkoutStarted: number;
    paymentCompleted: number;
    rates: {
        paywallToUpgrade: number;
        upgradeToCheckout: number;
        checkoutToPayment: number;
        paywallToPayment: number;
    };
}
export interface ContentAttribution {
    byPlatform: Record<string, {
        visitors: number;
        aiUsers: number;
        payingUsers: number;
        conversionRate: number;
    }>;
    byContentType: Record<string, {
        pieces: number;
        visitors: number;
        conversionRate: number;
    }>;
    topPerforming: Array<{
        contentId: string;
        platform: string;
        visitors: number;
        conversions: number;
    }>;
}
export interface WeeklyReport {
    week: string;
    traffic: {
        totalVisitors: number;
        bySource: Record<string, number>;
    };
    retention: {
        d1: number;
        d7: number;
    };
    usage: {
        dau: number;
        aiRequestsPerDau: number;
        totalAiRequests: number;
    };
    revenue: {
        newPayingUsers: number;
        mrr: number;
        totalPayments: number;
    };
    topMatches: Array<{
        matchId: string;
        views: number;
    }>;
    topContentSources: Array<{
        platform: string;
        visitors: number;
    }>;
    verdict: 'validated' | 'promising' | 'uncertain' | 'not_validated';
    recommendation: string;
}
export declare class MarketValidationService {
    private readonly userUsageService;
    private readonly logger;
    private paymentEvents;
    constructor(userUsageService: UserUsageService);
    getFunnel(days?: number): Promise<FunnelReport>;
    getRetention(cohortDate?: string): Promise<RetentionCohort[]>;
    getPaymentFunnel(): PaymentFunnel;
    trackPaymentEvent(userId: string, event: string, amount?: number): void;
    getContentAttribution(days?: number): Promise<ContentAttribution>;
    getNorthStarStatus(): Promise<{
        current: {
            dau: number;
            aiRequestsPerDau: number;
        };
        target: {
            dau: number;
            aiRequestsPerDau: number;
            d7: number;
            payments: number;
        };
        status: 'achieved' | 'in_progress' | 'at_risk' | 'not_met';
    }>;
    getWeeklyReport(): Promise<WeeklyReport>;
    private countActions;
    private buildStage;
    private today;
    private daysAgo;
}
//# sourceMappingURL=market-validation.service.d.ts.map