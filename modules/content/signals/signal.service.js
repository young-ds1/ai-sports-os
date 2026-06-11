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
var SignalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const signal_ranker_service_1 = require("./signal-ranker.service");
// Star player database — in production, this comes from players table + ranking API
const STAR_PLAYERS = {
    Argentina: [
        { name: 'Lionel Messi', tier: 'goat' },
        { name: 'Julián Álvarez', tier: 'star' },
    ],
    Brazil: [
        { name: 'Vinicius Jr', tier: 'superstar' },
        { name: 'Rodrygo', tier: 'star' },
    ],
    France: [
        { name: 'Kylian Mbappé', tier: 'superstar' },
    ],
    England: [
        { name: 'Jude Bellingham', tier: 'superstar' },
        { name: 'Harry Kane', tier: 'star' },
    ],
    Germany: [
        { name: 'Jamal Musiala', tier: 'star' },
        { name: 'Florian Wirtz', tier: 'star' },
    ],
    Spain: [
        { name: 'Lamine Yamal', tier: 'star' },
        { name: 'Pedri', tier: 'star' },
    ],
    Portugal: [
        { name: 'Cristiano Ronaldo', tier: 'goat' },
    ],
    Netherlands: [
        { name: 'Virgil van Dijk', tier: 'star' },
    ],
};
let SignalService = SignalService_1 = class SignalService {
    signalRanker;
    logger = new common_1.Logger(SignalService_1.name);
    constructor(signalRanker) {
        this.signalRanker = signalRanker;
    }
    async onMatchFinished(payload) {
        this.logger.log(`[Signal] match.finished → ${payload.homeTeam} ${payload.homeScore}-${payload.awayScore} ${payload.awayTeam}`);
        const input = this.buildHotScoreInput(payload);
        // Urgent: finished matches get immediate ranking
        this.signalRanker.submitUrgent(input);
    }
    async onMatchLiveUpdate(payload) {
        // Only submit live updates if there's drama
        const goals = (payload.homeScore || 0) + (payload.awayScore || 0);
        if (goals >= 3 || payload.metadata?.hasComeback || payload.metadata?.hasRedCard) {
            const input = this.buildHotScoreInput(payload);
            this.signalRanker.submit(input);
        }
    }
    async onMatchScheduled(payload) {
        const input = this.buildHotScoreInput(payload);
        // Scheduled matches go to buffer, ranked in batch
        this.signalRanker.submit(input);
    }
    /**
     * Build a HotScoreInput from a match event payload.
     */
    buildHotScoreInput(payload) {
        const homeStars = STAR_PLAYERS[payload.homeTeam] || [];
        const awayStars = STAR_PLAYERS[payload.awayTeam] || [];
        const allStars = [...homeStars, ...awayStars];
        const homeScore = payload.homeScore || 0;
        const awayScore = payload.awayScore || 0;
        const totalGoals = payload.metadata?.totalGoals ?? (homeScore + awayScore);
        // Social buzz simulation (Phase 4: real API)
        const hasStars = allStars.filter(s => s.tier === 'goat' || s.tier === 'superstar').length;
        const simulatedBuzz = hasStars > 1 ? 50000 : hasStars > 0 ? 20000 : 5000;
        // Trend position simulation
        const simulatedTrend = hasStars > 1 ? 2 : hasStars > 0 ? 5 : 25;
        return {
            matchId: payload.matchId,
            homeTeam: payload.homeTeam,
            awayTeam: payload.awayTeam,
            competition: payload.competition,
            tournamentStage: payload.tournamentStage || 'group',
            homeScore,
            awayScore,
            status: payload.status,
            elapsedMinute: payload.elapsedMinute,
            starPlayers: allStars,
            totalGoals,
            goalDiff: Math.abs(homeScore - awayScore),
            hasRedCard: payload.metadata?.hasRedCard || false,
            hasComeback: payload.metadata?.hasComeback || false,
            isExtraTime: false,
            isPenaltyShootout: false,
            lateDramaMinutes: payload.metadata?.lateDramaMinutes,
            externalMentions: simulatedBuzz,
            trendPosition: simulatedTrend,
        };
    }
};
exports.SignalService = SignalService;
__decorate([
    (0, event_emitter_1.OnEvent)('match.finished', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SignalService.prototype, "onMatchFinished", null);
__decorate([
    (0, event_emitter_1.OnEvent)('match.live_update', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SignalService.prototype, "onMatchLiveUpdate", null);
__decorate([
    (0, event_emitter_1.OnEvent)('match.scheduled', { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SignalService.prototype, "onMatchScheduled", null);
exports.SignalService = SignalService = SignalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [signal_ranker_service_1.SignalRankerService])
], SignalService);
//# sourceMappingURL=signal.service.js.map