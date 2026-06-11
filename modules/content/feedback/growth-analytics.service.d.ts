import { DistributionService } from '../distribution/distribution.service';
import { EngagementTrackerService } from './engagement-tracker.service';
import { UserUsageService } from '../../users/user-usage.service';
export interface GrowthDashboard {
    period: {
        start: string;
        end: string;
    };
    content: {
        total_generated: number;
        total_published: number;
        publish_rate: number;
        by_platform: Record<string, any>;
    };
    traffic: {
        estimated_clicks: number;
        estimated_conversions: number;
        conversion_rate: number;
    };
    growth: {
        new_users: number;
        returning_users: number;
        dau_trend: 'up' | 'down' | 'flat';
        ai_requests_per_dau: number;
    };
    recommendation: string;
}
export declare class GrowthAnalyticsService {
    private readonly distributionService;
    private readonly engagementTracker;
    private readonly userUsageService;
    constructor(distributionService: DistributionService, engagementTracker: EngagementTrackerService, userUsageService: UserUsageService);
    /**
     * Generate a complete growth dashboard.
     */
    getGrowthDashboard(days?: number): Promise<GrowthDashboard>;
    private generateRecommendation;
}
//# sourceMappingURL=growth-analytics.service.d.ts.map