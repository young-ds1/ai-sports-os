export declare const USER_SEGMENTS: {
    readonly football_fans: "Football Fans";
    readonly fantasy_players: "Fantasy Players";
    readonly sports_bettors: "Sports Bettors";
    readonly ai_enthusiasts: "AI Enthusiasts";
    readonly content_creators: "Content Creators";
    readonly casual_users: "Casual Sports Users";
};
type SegmentKey = keyof typeof USER_SEGMENTS;
interface SegmentProfile {
    segmentKey: SegmentKey;
    segmentName: string;
    users: number;
    dau: number;
    avgSessionsPerUser: number;
    aiRequestsPerUser: number;
    retentionD7: number;
    retentionD30: number;
    upgradeClicks: number;
    payments: number;
    revenueTotal: number;
    revenuePerUser: number;
    ltvEstimate: number;
    referralCount: number;
    referralRate: number;
    retentionScore: number;
    aiUsageScore: number;
    revenueScore: number;
    referralScore: number;
    icpScore: number;
    tier: 'core_icp' | 'growth_icp' | 'emerging' | 'low_value';
}
interface SegmentBestFit {
    segmentKey: SegmentKey;
    bestChannel: {
        channel: string;
        userCount: number;
        qualityScore: number;
    };
    bestContent: {
        experiment: string;
        aiPerUser: number;
        retention: number;
    };
    bestMatchType: {
        type: string;
        engagement: number;
        reason: string;
    };
}
interface ICPWeeklyReport {
    week: string;
    topSegment: {
        name: string;
        icpScore: number;
        why: string;
    };
    whoPays: {
        segment: string;
        revenuePerUser: number;
        totalRevenue: number;
    };
    whoStays: {
        segment: string;
        retentionD7: number;
        retentionD30: number;
    };
    whoShares: {
        segment: string;
        referralRate: number;
        totalReferrals: number;
    };
    growthAllocation: Array<{
        segment: string;
        budgetPct: number;
        reason: string;
    }>;
    segmentRanking: Array<{
        name: string;
        icpScore: number;
        tier: string;
        users: number;
    }>;
    recommendation: string;
}
export declare class ICPValidationService {
    private readonly logger;
    private users;
    segmentUser(userId: string, segment: SegmentKey): void;
    trackAction(userId: string, params: {
        channel?: string;
        contentExperiment?: string;
        action: 'session' | 'ai_request' | 'upgrade' | 'payment' | 'referral';
        amount?: number;
    }): void;
    getSegmentProfiles(): SegmentProfile[];
    getBestFitPerSegment(): SegmentBestFit[];
    getICPWeeklyReport(): ICPWeeklyReport;
    private today;
    private daysAgo;
    private seedSegmentProfiles;
}
export {};
//# sourceMappingURL=icp-validation.service.d.ts.map