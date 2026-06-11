import { UserUsageService } from './user-usage.service';
import { MarketValidationService } from './market-validation.service';
/**
 * GrowthDashboardService — measures distribution effectiveness.
 *
 * Goal: 100 real football users.
 * No new features. Only distribution tracking + content automation.
 */
export interface AcquisitionSnapshot {
    timestamp: string;
    totalVisitors: number;
    totalSignups: number;
    totalPaying: number;
    bySource: Record<string, {
        visitors: number;
        signups: number;
        aiUsers: number;
        payingUsers: number;
        conversionRate: number;
        costPerAcquisition: string;
    }>;
    byCampaign: Record<string, {
        visitors: number;
        signups: number;
    }>;
    byContentType: Record<string, {
        pieces: number;
        visitors: number;
        avgEngagement: number;
    }>;
}
export interface DailyContentPlan {
    date: string;
    matches: Array<{
        matchId: string;
        homeTeam: string;
        awayTeam: string;
        kickoffTime: string;
        interestScore: number;
        contentGenerated: string[];
    }>;
    totalPieces: number;
    platforms: string[];
    estimatedReach: number;
}
export interface SuccessMetrics {
    target: {
        users: number;
        aiPerDau: number;
        d7: number;
        payingUsers: number;
    };
    current: {
        users: number;
        aiPerDau: number;
        d7: number;
        payingUsers: number;
    };
    progress: {
        usersPct: number;
        aiPerDauPct: number;
        d7Pct: number;
        payingPct: number;
    };
    projectedDaysToTarget: number | null;
    status: 'on_track' | 'behind' | 'critical';
}
export declare class GrowthDashboardService {
    private readonly userUsageService;
    private readonly marketValidation;
    private readonly logger;
    private visitorLog;
    constructor(userUsageService: UserUsageService, marketValidation: MarketValidationService);
    trackVisitor(params: {
        source: string;
        campaign?: string;
        contentType?: string;
        signedUp?: boolean;
        didAiAction?: boolean;
        didPay?: boolean;
    }): void;
    getAcquisitionSnapshot(days?: number): Promise<AcquisitionSnapshot>;
    getDailyContentPlan(): DailyContentPlan;
    getContentForMatch(matchId: string): Array<{
        type: string;
        title: string;
        hook: string;
    }>;
    getSuccessMetrics(): Promise<SuccessMetrics>;
    dailyContentCron(): Promise<void>;
    private seedBenchmarkData;
}
//# sourceMappingURL=growth-dashboard.service.d.ts.map