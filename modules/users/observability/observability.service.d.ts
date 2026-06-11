import { UserUsageService } from '../user-usage.service';
import { CostTrackerService } from '../../ai-engine/cost/cost-tracker.service';
export interface DashboardSnapshot {
    timestamp: string;
    metrics: {
        dau: number;
        ai_requests_per_dau: number;
        total_ai_requests: number;
        ai_analysis_ctr: number | null;
        estimated_daily_cost: number;
        estimated_monthly_cost: number;
    };
    top_matches: Array<{
        entity_id: string;
        views: number;
    }>;
    usage_by_tier: Record<string, {
        users: number;
        requests: number;
    }>;
    health: {
        cache_hit_rate: number | null;
        avg_latency_ms: number | null;
        cost_status: 'green' | 'yellow' | 'red';
        rate_limit_breaches: number;
    };
}
export declare class ObservabilityService {
    private readonly userUsageService;
    private readonly costTracker;
    private readonly logger;
    private rateLimitBreaches;
    constructor(userUsageService: UserUsageService, costTracker: CostTrackerService);
    /**
     * Generate a complete dashboard snapshot for the admin panel.
     */
    getDashboardSnapshot(date?: string): Promise<DashboardSnapshot>;
    /**
     * Track a rate limit breach for monitoring.
     */
    trackRateLimitBreach(userId: string, endpoint: string): void;
    /**
     * Log a user journey event for funnel analysis.
     */
    trackJourney(userId: string, step: string, metadata?: Record<string, any>): void;
}
//# sourceMappingURL=observability.service.d.ts.map