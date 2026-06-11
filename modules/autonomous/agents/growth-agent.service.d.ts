import { GrowthFeedbackService } from '../../content/feedback/growth-feedback.service';
import { HookOptimizerService } from '../../content/factory/hook-optimizer.service';
import { EngagementTrackerService } from '../../content/feedback/engagement-tracker.service';
import { RevenueFlywheelService } from '../../revenue/revenue-flywheel.service';
import { StrategyDecision } from './strategy-agent.service';
import { ContentAgentReport } from './content-agent.service';
import { DistributionReport } from './distribution-agent.service';
/**
 * GrowthAgent — autonomous growth analysis & optimization.
 *
 * Reads CTR, engagement, and conversion data.
 * Recommends what to change for the NEXT strategy cycle.
 * Feeds insights back to StrategyAgent via feedback loop.
 */
export interface GrowthAnalysis {
    timestamp: Date;
    contentPerformance: {
        topPlatform: string;
        topHook: string;
        avgCtr: number;
        avgEngagement: number;
    };
    conversionFunnel: {
        impressions: number;
        clicks: number;
        signups: number;
        aiUsers: number;
        payingUsers: number;
        overallConversionRate: number;
    };
    whatImproved: string[];
    whatDeclined: string[];
    recommendations: string[];
    priorityAction: string;
}
export declare class GrowthAgentService {
    private readonly growthFeedback;
    private readonly hookOptimizer;
    private readonly engagementTracker;
    private readonly flywheel;
    private readonly logger;
    private previousMetrics;
    constructor(growthFeedback: GrowthFeedbackService, hookOptimizer: HookOptimizerService, engagementTracker: EngagementTrackerService, flywheel: RevenueFlywheelService);
    /**
     * Analyze growth data and produce actionable recommendations.
     */
    analyze(strategy: StrategyDecision, contentReport: ContentAgentReport, distributionReport: DistributionReport): Promise<GrowthAnalysis>;
}
//# sourceMappingURL=growth-agent.service.d.ts.map