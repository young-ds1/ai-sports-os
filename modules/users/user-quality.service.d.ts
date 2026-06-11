interface ChannelQuality {
    channel: string;
    totalVisitors: number;
    avgQualityScore: number;
    medianQualityScore: number;
    highIntentPct: number;
    mediumIntentPct: number;
    lowIntentPct: number;
    aiRequestsPerUser: number;
    retentionRate: number;
    payments: number;
    revenue: number;
    qualityRank: number;
    trafficRank: number;
    verdict: 'premium_channel' | 'volume_channel' | 'mixed' | 'poor';
}
interface ContentQuality {
    experimentName: string;
    impressions: number;
    registrations: number;
    avgUserQualityScore: number;
    aiRequestsPerUser: number;
    retentionRate: number;
    shareRate: number;
    engagementRank: number;
    ctrRank: number;
    verdict: 'high_engagement' | 'high_ctr_low_engagement' | 'low_performance';
}
interface ShareLoopAnalysis {
    totalSharers: number;
    totalShares: number;
    sharesPerSharer: number;
    invitedUsers: number;
    invitedUserQualityScore: number;
    topSharingContent: Array<{
        experiment: string;
        shares: number;
        invitedQuality: number;
    }>;
    viralCoefficient: number;
}
interface WeeklyQualityReport {
    week: string;
    bestChannel: {
        name: string;
        qualityScore: number;
        reason: string;
    };
    bestContent: {
        name: string;
        engagementScore: number;
        reason: string;
    };
    highestQualitySegment: {
        intent: string;
        pct: number;
        aiPerUser: number;
    };
    mostSharedContent: {
        experiment: string;
        shares: number;
    };
    highestRevenueSource: {
        channel: string;
        revenue: number;
    };
    qualityDistribution: {
        high: number;
        medium: number;
        low: number;
    };
    scaleCandidates: string[];
    killCandidates: string[];
    recommendation: string;
}
export declare class UserQualityService {
    private readonly logger;
    private users;
    private shareRecords;
    trackUserAction(params: {
        userId: string;
        channel: string;
        contentExperiment: string;
        action: 'page_view' | 'ai_analysis' | 'ai_chat' | 'paywall_view' | 'upgrade_click' | 'payment' | 'share';
        invitedBy?: string;
    }): void;
    private calculateQualityScore;
    getUserQualityDistribution(): {
        high: number;
        medium: number;
        low: number;
        total: number;
    };
    getChannelQualityReport(): {
        channels: ChannelQuality[];
        summary: string;
    };
    getContentQualityReport(): {
        content: ContentQuality[];
        summary: string;
    };
    getShareLoopAnalysis(): ShareLoopAnalysis;
    getQualityBasedDecisions(): {
        scaleCandidates: string[];
        killCandidates: string[];
        decisions: Array<{
            channel: string;
            decision: string;
            reason: string;
        }>;
    };
    getWeeklyQualityReport(): WeeklyQualityReport;
    private today;
    private daysAgo;
    private seedChannelQualityDemo;
    private seedContentQualityDemo;
    private seedShareLoopDemo;
}
export {};
//# sourceMappingURL=user-quality.service.d.ts.map