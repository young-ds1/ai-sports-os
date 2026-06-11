import { StrategyAgentService, StrategyDecision } from './agents/strategy-agent.service';
import { ContentAgentService, ContentAgentReport } from './agents/content-agent.service';
import { DistributionAgentService, DistributionReport } from './agents/distribution-agent.service';
import { GrowthAgentService, GrowthAnalysis } from './agents/growth-agent.service';
import { MonetizationAgentService, MonetizationOptimization } from './agents/monetization-agent.service';
/**
 * AutonomousLoopService — the central orchestrator.
 *
 * Runs 5 autonomous agents in sequence every 30 minutes.
 *
 * Loop:
 *   Strategy → Content → Distribution → Growth → Monetization
 *     ↑_____________________________________________________|
 *              (feedback loop — Growth & Monetization
 *               inform next Strategy cycle)
 *
 * Human role: Monitor only. The system decides, executes, measures, and adapts.
 */
export interface LoopCycle {
    cycleId: number;
    startedAt: Date;
    completedAt: Date | null;
    durationMs: number | null;
    status: 'running' | 'completed' | 'failed';
    strategy: StrategyDecision | null;
    content: ContentAgentReport | null;
    distribution: DistributionReport | null;
    growth: GrowthAnalysis | null;
    monetization: MonetizationOptimization | null;
    error?: string;
}
export declare class AutonomousLoopService {
    private readonly strategyAgent;
    private readonly contentAgent;
    private readonly distributionAgent;
    private readonly growthAgent;
    private readonly monetizationAgent;
    private readonly logger;
    private cycles;
    private cycleCount;
    private isRunning;
    private startedAt;
    private lastGrowthAnalysis;
    private lastMonetizationOptimization;
    constructor(strategyAgent: StrategyAgentService, contentAgent: ContentAgentService, distributionAgent: DistributionAgentService, growthAgent: GrowthAgentService, monetizationAgent: MonetizationAgentService);
    /**
     * Main autonomous loop — runs every 30 minutes.
     */
    executeCycle(): Promise<void>;
    /**
     * Get current autonomous system status.
     */
    getStatus(): {
        isRunning: boolean;
        uptime: string;
        totalCycles: number;
        lastCycle: LoopCycle | null;
        currentObjective: string;
        feedbackState: {
            growth: GrowthAnalysis | null;
            monetization: MonetizationOptimization | null;
        };
    };
    /**
     * Get cycle history.
     */
    getHistory(limit?: number): LoopCycle[];
    /**
     * Manual trigger — force a cycle immediately.
     */
    triggerCycle(): Promise<LoopCycle>;
}
//# sourceMappingURL=autonomous-loop.service.d.ts.map