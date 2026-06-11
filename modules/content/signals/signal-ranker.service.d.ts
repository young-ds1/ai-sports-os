import { EventEmitter2 } from '@nestjs/event-emitter';
import { HotScoreService, HotScoreInput, HotScoreResult } from './hot-score.service';
/**
 * SignalRanker — scores all active match signals, keeps only top 10%.
 * Emits 'content.explode' for explosive signals only.
 *
 * This replaces the STEP 7 pattern of "trigger on every match event".
 * STEP 8: only nuclear + hot matches get content explosion.
 */
export interface ExplosiveSignal extends HotScoreResult {
    matchData: HotScoreInput;
    triggeredAt: Date;
}
export declare class SignalRankerService {
    private readonly hotScore;
    private readonly eventEmitter;
    private readonly logger;
    private signalBuffer;
    private rankInterval;
    private readonly TOP_PERCENTILE;
    private readonly MIN_EXPLOSIVE;
    constructor(hotScore: HotScoreService, eventEmitter: EventEmitter2);
    /**
     * Submit a match signal for scoring.
     * Signals are buffered and ranked in batch every 5 minutes.
     */
    submit(signal: HotScoreInput): void;
    /**
     * Force immediate ranking (e.g., on match.finished event).
     */
    submitUrgent(signal: HotScoreInput): void;
    /**
     * Main ranking cycle:
     * 1. Score all buffered signals
     * 2. Sort by totalScore descending
     * 3. Take top 10% (minimum 1)
     * 4. Emit 'content.explode' for each
     * 5. Clear buffer
     */
    private rankAndEmit;
    private scoreAll;
    private filterExplosive;
    private emitExplosion;
    /**
     * Get current buffer status (for admin dashboard).
     */
    getStatus(): {
        bufferSize: number;
        lastRankAt: Date | null;
    };
    onModuleDestroy(): void;
}
//# sourceMappingURL=signal-ranker.service.d.ts.map