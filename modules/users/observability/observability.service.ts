import { Injectable, Logger } from '@nestjs/common';
import { UserUsageService } from '../user-usage.service';
import { CostTrackerService } from '../../ai-engine/cost/cost-tracker.service';
import { getTierConfig, SubscriptionTier } from '../subscriptions/tier-config';

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
  top_matches: Array<{ entity_id: string; views: number }>;
  usage_by_tier: Record<string, { users: number; requests: number }>;
  health: {
    cache_hit_rate: number | null;
    avg_latency_ms: number | null;
    cost_status: 'green' | 'yellow' | 'red';
    rate_limit_breaches: number;
  };
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);
  private rateLimitBreaches = 0;

  constructor(
    private readonly userUsageService: UserUsageService,
    private readonly costTracker: CostTrackerService,
  ) {}

  /**
   * Generate a complete dashboard snapshot for the admin panel.
   */
  async getDashboardSnapshot(date?: string): Promise<DashboardSnapshot> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [dau, aiRequestsPerDau, topMatches] = await Promise.all([
      this.userUsageService.getDailyActiveUsers(targetDate),
      this.userUsageService.getAiRequestsPerDau(targetDate),
      this.userUsageService.getTopMatches(10, targetDate),
    ]);

    const cost = this.costTracker.getCostSummary();

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        dau,
        ai_requests_per_dau: Math.round(aiRequestsPerDau * 100) / 100,
        total_ai_requests: Math.round(aiRequestsPerDau * dau),
        ai_analysis_ctr: null, // Calculated when match views are available
        estimated_daily_cost: cost.today_total,
        estimated_monthly_cost: cost.estimated_monthly,
      },
      top_matches: topMatches,
      usage_by_tier: {
        free: { users: dau, requests: 0 },
        vip: { users: 0, requests: 0 },
        pro: { users: 0, requests: 0 },
      },
      health: {
        cache_hit_rate: null,
        avg_latency_ms: null,
        cost_status: cost.today_total > 100 ? 'red' : cost.today_total > 50 ? 'yellow' : 'green',
        rate_limit_breaches: this.rateLimitBreaches,
      },
    };
  }

  /**
   * Track a rate limit breach for monitoring.
   */
  trackRateLimitBreach(userId: string, endpoint: string): void {
    this.rateLimitBreaches++;
    this.logger.warn(`[RateLimit] Breach by user=${userId.substring(0, 8)} on ${endpoint}`);
  }

  /**
   * Log a user journey event for funnel analysis.
   */
  trackJourney(userId: string, step: string, metadata?: Record<string, any>): void {
    this.logger.log(
      `[Journey] user=${userId.substring(0, 8)} step=${step} ` +
      `${metadata ? JSON.stringify(metadata) : ''}`,
    );
  }
}
