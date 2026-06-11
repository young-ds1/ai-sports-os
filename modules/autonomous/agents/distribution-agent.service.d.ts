import { DistributionService } from '../../content/distribution/distribution.service';
import { ContentService } from '../../content/content.service';
import { StrategyDecision } from './strategy-agent.service';
/**
 * DistributionAgent — autonomous content distribution.
 *
 * Decides WHERE and WHEN to publish each content piece.
 * No human chooses the publishing schedule.
 *
 * Strategy:
 * - Match content to platform best-time windows
 * - Prioritize platforms that the StrategyAgent flagged as focusChannel
 * - Queue content for publishing, report what's pending
 */
export interface DistributionDecision {
    platform: string;
    outputCount: number;
    bestTime: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
}
export interface DistributionReport {
    timestamp: Date;
    decisions: DistributionDecision[];
    totalPending: number;
    totalPublished: number;
    focusChannel: string;
    nextPublishWindow: string;
    summary: string;
}
export declare class DistributionAgentService {
    private readonly distributionService;
    private readonly contentService;
    private readonly logger;
    constructor(distributionService: DistributionService, contentService: ContentService);
    /**
     * Decide distribution plan based on strategy.
     */
    execute(strategy: StrategyDecision): Promise<DistributionReport>;
}
//# sourceMappingURL=distribution-agent.service.d.ts.map