import { ObservabilityService } from '../../../../modules/users/observability/observability.service';
import { CostTrackerService } from '../../../../modules/ai-engine/cost/cost-tracker.service';
import { UserUsageService } from '../../../../modules/users/user-usage.service';
export declare class AnalyticsController {
    private readonly observability;
    private readonly costTracker;
    private readonly userUsageService;
    constructor(observability: ObservabilityService, costTracker: CostTrackerService, userUsageService: UserUsageService);
    getDashboard(date?: string): Promise<import("../../../../modules/users/observability/observability.service").DashboardSnapshot>;
    getCosts(): Promise<{
        today_total: number;
        estimated_monthly: number;
        per_user_avg: number;
        model_breakdown: Record<string, number>;
    }>;
    getNorthStarMetric(days?: number): Promise<{
        data: {
            date: string;
            ai_requests_per_dau: number;
            dau: number;
        }[];
    }>;
    getTopMatches(date?: string, limit?: number): Promise<{
        entity_id: string;
        views: number;
    }[]>;
}
//# sourceMappingURL=analytics.controller.d.ts.map