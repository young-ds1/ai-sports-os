import { HotScoreResult } from '../signals/hot-score.service';
/**
 * HookOptimizer — learns which content patterns drive the highest CTR/engagement.
 * Feeds winning patterns back into the AI prompt for better content.
 *
 * This is a simplified learning system. Phase 4+ should use actual A/B test data.
 */
interface HookPattern {
    id: string;
    platform: string;
    pattern: string;
    example: string;
    avgCtr: number;
    avgEngagement: number;
    useCount: number;
    lastUsedAt: Date;
}
export declare class HookOptimizerService {
    private patterns;
    /**
     * Get the best-performing hook patterns sorted by CTR.
     */
    getBestPatterns(limit?: number): HookPattern[];
    /**
     * Get best patterns for a specific platform.
     */
    getBestForPlatform(platform: string, limit?: number): HookPattern[];
    /**
     * Enhance content body by applying platform-specific hook optimizations.
     */
    enhance(platform: string, body: string, signal?: HotScoreResult): string;
    /**
     * Record engagement data to update pattern performance.
     * This closes the feedback loop — patterns that drive CTR get used more.
     */
    recordEngagement(patternId: string, metrics: {
        ctr: number;
        engagement: number;
    }): void;
    /**
     * Get all patterns with performance data (for growth dashboard).
     */
    getAllPatterns(): HookPattern[];
}
export {};
//# sourceMappingURL=hook-optimizer.service.d.ts.map