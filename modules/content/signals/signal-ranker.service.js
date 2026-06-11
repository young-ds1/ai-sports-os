"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SignalRankerService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalRankerService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const hot_score_service_1 = require("./hot-score.service");
let SignalRankerService = SignalRankerService_1 = class SignalRankerService {
    hotScore;
    eventEmitter;
    logger = new common_1.Logger(SignalRankerService_1.name);
    signalBuffer = new Map();
    rankInterval = null;
    // Threshold: top 10% of scored matches
    TOP_PERCENTILE = 0.10;
    // Minimum: always emit at least 1 explosive signal per cycle
    MIN_EXPLOSIVE = 1;
    constructor(hotScore, eventEmitter) {
        this.hotScore = hotScore;
        this.eventEmitter = eventEmitter;
        // Rank and emit every 5 minutes
        this.rankInterval = setInterval(() => this.rankAndEmit(), 5 * 60 * 1000);
    }
    /**
     * Submit a match signal for scoring.
     * Signals are buffered and ranked in batch every 5 minutes.
     */
    submit(signal) {
        this.signalBuffer.set(signal.matchId, signal);
        this.logger.log(`[Ranker] Buffered signal for ${signal.homeTeam} vs ${signal.awayTeam} ` +
            `(buffer size: ${this.signalBuffer.size})`);
        // If buffer hits 20, rank immediately
        if (this.signalBuffer.size >= 20) {
            this.rankAndEmit();
        }
    }
    /**
     * Force immediate ranking (e.g., on match.finished event).
     */
    submitUrgent(signal) {
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
    rankAndEmit() {
        if (this.signalBuffer.size === 0)
            return;
        const scored = this.scoreAll();
        const explosive = this.filterExplosive(scored);
        this.logger.log(`[Ranker] Scored ${scored.length} signals → ${explosive.length} explosive ` +
            `(${Math.round((explosive.length / Math.max(scored.length, 1)) * 100)}%)\n` +
            scored.slice(0, 5).map(s => `  ${s.tier.toUpperCase()} [${s.totalScore}] ${s.reason}`).join('\n'));
        for (const s of explosive) {
            this.emitExplosion(s);
        }
        // Clear processed signals
        this.signalBuffer.clear();
    }
    scoreAll() {
        return Array.from(this.signalBuffer.values())
            .map(signal => this.hotScore.calculate(signal))
            .sort((a, b) => b.totalScore - a.totalScore);
    }
    filterExplosive(scored) {
        if (scored.length === 0)
            return [];
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
    emitExplosion(result) {
        const signal = this.signalBuffer.get(result.matchId);
        if (!signal)
            return;
        const explosive = {
            ...result,
            matchData: signal,
            triggeredAt: new Date(),
        };
        this.eventEmitter.emit('content.explode', explosive);
        this.logger.log(`💥 [EXPLOSION] ${signal.homeTeam} vs ${signal.awayTeam} ` +
            `score=${result.totalScore} tier=${result.tier} reason="${result.reason}"`);
    }
    /**
     * Get current buffer status (for admin dashboard).
     */
    getStatus() {
        return {
            bufferSize: this.signalBuffer.size,
            lastRankAt: null,
        };
    }
    onModuleDestroy() {
        if (this.rankInterval)
            clearInterval(this.rankInterval);
    }
};
exports.SignalRankerService = SignalRankerService;
exports.SignalRankerService = SignalRankerService = SignalRankerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hot_score_service_1.HotScoreService, typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object])
], SignalRankerService);
//# sourceMappingURL=signal-ranker.service.js.map