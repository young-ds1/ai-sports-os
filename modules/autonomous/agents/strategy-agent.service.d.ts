import { HotScoreService } from '../../content/signals/hot-score.service';
import { SignalRankerService } from '../../content/signals/signal-ranker.service';
import { RetentionEngineService } from '../../revenue/retention-engine.service';
import { RevenueFlywheelService } from '../../revenue/revenue-flywheel.service';
import { MatchesService } from '../../domain/matches/matches.service';
/**
 * StrategyAgent — the brain of the autonomous system.
 *
 * Makes decisions without human input:
 * - Which matches to cover today?
 * - What content types to prioritize?
 * - Where to allocate growth budget?
 * - What's the #1 bottleneck right now?
 *
 * Decision principle: MAXIMIZE next-week projected MRR.
 * All strategy decisions flow from "what will increase revenue next week?"
 */
export interface StrategyDecision {
    timestamp: Date;
    cycle: number;
    primaryObjective: string;
    reasoning: string;
    matchCoverage: {
        totalMatchesToday: number;
        selectedForContent: number;
        topMatchIds: string[];
        selectionCriteria: string;
    };
    contentPlan: {
        primaryContentType: string;
        platforms: string[];
        hooksToUse: string[];
        contentPiecesTarget: number;
    };
    growthDirective: {
        focusChannel: string;
        budgetRecommendation: string;
    };
    bottleneck: {
        current: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        suggestedFix: string;
    };
    confidenceScore: number;
}
export declare class StrategyAgentService {
    private readonly hotScore;
    private readonly signalRanker;
    private readonly retention;
    private readonly flywheel;
    private readonly matchesService;
    private readonly logger;
    private cycleCount;
    private decisionLog;
    constructor(hotScore: HotScoreService, signalRanker: SignalRankerService, retention: RetentionEngineService, flywheel: RevenueFlywheelService, matchesService: MatchesService);
    /**
     * Decide: what should the system do this cycle?
     */
    decide(): Promise<StrategyDecision>;
    /**
     * Quick match score without full HotScoreInput (for autonomous decision speed).
     */
    private quickScore;
    private calculateConfidence;
    getDecisionLog(limit?: number): StrategyDecision[];
}
//# sourceMappingURL=strategy-agent.service.d.ts.map