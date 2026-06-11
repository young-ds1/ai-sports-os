import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class SignalRankerService {
  private readonly logger = new Logger(SignalRankerService.name);
  private signalBuffer: Map<string, HotScoreInput> = new Map();
  private rankInterval: NodeJS.Timeout | null = null;

  // Threshold: top 10% of scored matches
  private readonly TOP_PERCENTILE = 0.10;
  // Minimum: always emit at least 1 explosive signal per cycle
  private readonly MIN_EXPLOSIVE = 1;

  constructor(
    private readonly hotScore: HotScoreService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Rank and emit every 5 minutes
    this.rankInterval = setInterval(() => this.rankAndEmit(), 5 * 60 * 1000);
  }

  /**
   * Submit a match signal for scoring.
   * Signals are buffered and ranked in batch every 5 minutes.
   */
  submit(signal: HotScoreInput): void {
    this.signalBuffer.set(signal.matchId, signal);
    this.logger.log(
      `[Ranker] Buffered signal for ${signal.homeTeam} vs ${signal.awayTeam} ` +
      `(buffer size: ${this.signalBuffer.size})`,
    );

    // If buffer hits 20, rank immediately
    if (this.signalBuffer.size >= 20) {
      this.rankAndEmit();
    }
  }

  /**
   * Force immediate ranking (e.g., on match.finished event).
   */
  submitUrgent(signal: HotScoreInput): void {
    this.signalBuffer.set(signal.matchId, signal);
    const scored = this.scoreAll();
    const explosive = this.filterExplosive(scored);

    for (const s of explosive) {
      this.emitExplosion(s);
    }
  }

  /**
   * Main ranking cycle:
   * 1. Score all buffered signals
   * 2. Sort by totalScore descending
   * 3. Take top 10% (minimum 1)
   * 4. Emit 'content.explode' for each
   * 5. Clear buffer
   */
  private rankAndEmit(): void {
    if (this.signalBuffer.size === 0) return;

    const scored = this.scoreAll();
    const explosive = this.filterExplosive(scored);

    this.logger.log(
      `[Ranker] Scored ${scored.length} signals → ${explosive.length} explosive ` +
      `(${Math.round((explosive.length / Math.max(scored.length, 1)) * 100)}%)\n` +
      scored.slice(0, 5).map(s =>
        `  ${s.tier.toUpperCase()} [${s.totalScore}] ${s.reason}`
      ).join('\n'),
    );

    for (const s of explosive) {
      this.emitExplosion(s);
    }

    // Clear processed signals
    this.signalBuffer.clear();
  }

  private scoreAll(): HotScoreResult[] {
    return Array.from(this.signalBuffer.values())
      .map(signal => this.hotScore.calculate(signal))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  private filterExplosive(scored: HotScoreResult[]): HotScoreResult[] {
    if (scored.length === 0) return [];

    // Calculate top N
    const topN = Math.max(this.MIN_EXPLOSIVE, Math.ceil(scored.length * this.TOP_PERCENTILE));

    // Take top N that are at least "hot" tier (>= 55)
    const qualified = scored.filter(s => s.tier === 'nuclear' || s.tier === 'hot');
    const result = qualified.slice(0, topN);

    // If no qualified signals but we have matches, take the top scorer (minimum)
    if (result.length === 0 && scored.length > 0 && scored[0].totalScore >= 25) {
      return [scored[0]];
    }

    return result;
  }

  private emitExplosion(result: HotScoreResult): void {
    const signal = this.signalBuffer.get(result.matchId);
    if (!signal) return;

    const explosive: ExplosiveSignal = {
      ...result,
      matchData: signal,
      triggeredAt: new Date(),
    };

    this.eventEmitter.emit('content.explode', explosive);
    this.logger.log(
      `💥 [EXPLOSION] ${signal.homeTeam} vs ${signal.awayTeam} ` +
      `score=${result.totalScore} tier=${result.tier} reason="${result.reason}"`,
    );
  }

  /**
   * Get current buffer status (for admin dashboard).
   */
  getStatus(): { bufferSize: number; lastRankAt: Date | null } {
    return {
      bufferSize: this.signalBuffer.size,
      lastRankAt: null,
    };
  }

  onModuleDestroy(): void {
    if (this.rankInterval) clearInterval(this.rankInterval);
  }
}
