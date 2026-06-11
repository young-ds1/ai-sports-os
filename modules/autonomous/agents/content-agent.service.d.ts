import { ContentExplosionService } from '../../content/factory/content-explosion.service';
import { HookOptimizerService } from '../../content/factory/hook-optimizer.service';
import { SignalRankerService } from '../../content/signals/signal-ranker.service';
import { HotScoreService } from '../../content/signals/hot-score.service';
import { StrategyDecision } from './strategy-agent.service';
import { MatchesService } from '../../domain/matches/matches.service';
/**
 * ContentAgent — autonomous content generation.
 *
 * Takes the StrategyDecision → generates content for selected matches.
 * Uses HookOptimizer to automatically select best hooks.
 * No human chooses what to write.
 */
export interface ContentAgentReport {
    timestamp: Date;
    matchesProcessed: number;
    contentPiecesGenerated: number;
    platformsUsed: string[];
    primaryContentType: string;
    hooksApplied: string[];
    errors: string[];
    summary: string;
}
export declare class ContentAgentService {
    private readonly contentExplosion;
    private readonly hookOptimizer;
    private readonly signalRanker;
    private readonly hotScore;
    private readonly matchesService;
    private readonly logger;
    constructor(contentExplosion: ContentExplosionService, hookOptimizer: HookOptimizerService, signalRanker: SignalRankerService, hotScore: HotScoreService, matchesService: MatchesService);
    /**
     * Execute content generation based on strategy.
     */
    execute(strategy: StrategyDecision): Promise<ContentAgentReport>;
}
//# sourceMappingURL=content-agent.service.d.ts.map