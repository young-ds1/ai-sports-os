import { AutonomousLoopService } from './autonomous-loop.service';
export declare class AutonomousController {
    private readonly loop;
    constructor(loop: AutonomousLoopService);
    /**
     * System status — is the autonomous company running?
     */
    getStatus(): Promise<{
        data: {
            isRunning: boolean;
            uptime: string;
            totalCycles: number;
            lastCycle: import("./autonomous-loop.service").LoopCycle | null;
            currentObjective: string;
            feedbackState: {
                growth: import("./agents/growth-agent.service").GrowthAnalysis | null;
                monetization: import("./agents/monetization-agent.service").MonetizationOptimization | null;
            };
        };
    }>;
    /**
     * Cycle history — what has the system been doing?
     */
    getHistory(): Promise<{
        data: import("./autonomous-loop.service").LoopCycle[];
    }>;
    /**
     * Manual trigger — force a cycle now (for testing/demo).
     */
    triggerCycle(): Promise<{
        data: import("./autonomous-loop.service").LoopCycle;
    }>;
}
//# sourceMappingURL=autonomous.controller.d.ts.map