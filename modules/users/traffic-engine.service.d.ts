import { UserUsageService } from './user-usage.service';
export declare const ACQUISITION_CHANNELS: {
    readonly CHANNEL_A: "xiaohongshu";
    readonly CHANNEL_B: "x";
    readonly CHANNEL_C: "telegram";
    readonly CHANNEL_D: "seo";
};
export declare const CONTENT_EXPERIMENTS: {
    readonly A: "prediction";
    readonly B: "tactical_analysis";
    readonly C: "controversial_opinion";
    readonly D: "ai_was_wrong";
    readonly E: "ai_was_right";
};
interface ChannelScorecard {
    channel: string;
    period: {
        start: string;
        end: string;
    };
    visitors: number;
    registrations: number;
    aiAnalysisClicks: number;
    aiChatUsage: number;
    paywallViews: number;
    payments: number;
    ctr: number;
    signupRate: number;
    aiRequestsPerUser: number;
    retentionRate: number;
    revenue: number;
    cac: number;
    status: 'winner' | 'failing' | 'testing' | 'unknown';
    consecutiveDaysBelowThreshold: number;
    recommendation: string;
}
interface ContentPerformance {
    experimentId: string;
    experimentName: string;
    impressions: number;
    clicks: number;
    ctr: number;
    registrations: number;
    aiRequests: number;
    winRate: number;
}
interface WeeklyTrafficReport {
    week: string;
    totalVisitors: number;
    totalRegistrations: number;
    totalPayments: number;
    topChannels: Array<{
        channel: string;
        visitors: number;
        ctr: number;
        status: string;
    }>;
    topCampaigns: Array<{
        campaign: string;
        visitors: number;
        conversions: number;
    }>;
    topContent: Array<{
        experiment: string;
        ctr: number;
        winRate: number;
    }>;
    topMatches: Array<{
        matchId: string;
        views: number;
    }>;
    virality: {
        totalShares: number;
        sharesPerUser: number;
    };
    scorecard: ChannelScorecard[];
    recommendation: string;
}
export declare class TrafficEngineService {
    private readonly userUsageService;
    private readonly logger;
    private visitors;
    private shares;
    private dayCounter;
    constructor(userUsageService: UserUsageService);
    getAcquisitionDashboard(): Promise<{
        today: {
            visitors: number;
            registrations: number;
            aiClicks: number;
            chatUses: number;
            paywalls: number;
            payments: number;
        };
        byChannel: Record<string, {
            visitors: number;
            registrations: number;
            aiClicks: number;
            payments: number;
        }>;
        byCampaign: Record<string, {
            visitors: number;
            registrations: number;
        }>;
        byContentType: Record<string, {
            impressions: number;
            clicks: number;
            ctr: number;
        }>;
    }>;
    trackChannelVisit(params: {
        channel: string;
        campaign: string;
        contentId: string;
        contentExperiment: string;
        registered?: boolean;
        clickedAiAnalysis?: boolean;
        usedAiChat?: boolean;
        sawPaywall?: boolean;
        paid?: boolean;
    }): void;
    getContentPerformance(): ContentPerformance[];
    trackShare(userId: string, platform: string): void;
    getViralityMetrics(): {
        totalShares: number;
        sharesPerUser: number;
        byPlatform: Record<string, number>;
    };
    getChannelScorecard(): Promise<ChannelScorecard[]>;
    getKillList(): ChannelScorecard[];
    getScaleList(): ChannelScorecard[];
    getAutoDecisions(): Array<{
        channel: string;
        decision: 'KILL' | 'SCALE' | 'MAINTAIN';
        reason: string;
    }>;
    getWeeklyTrafficReport(): Promise<WeeklyTrafficReport>;
    private getChannelScorecardSync;
    private getDailyCountsByChannel;
    private getDaysSinceFirstVisitor;
    private seedDemoData;
    private today;
    private daysAgo;
}
export {};
//# sourceMappingURL=traffic-engine.service.d.ts.map