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
var ContentAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentAgentService = void 0;
const common_1 = require("@nestjs/common");
const content_explosion_service_1 = require("../../content/factory/content-explosion.service");
const hook_optimizer_service_1 = require("../../content/factory/hook-optimizer.service");
const signal_ranker_service_1 = require("../../content/signals/signal-ranker.service");
const hot_score_service_1 = require("../../content/signals/hot-score.service");
const matches_service_1 = require("../../domain/matches/matches.service");
let ContentAgentService = ContentAgentService_1 = class ContentAgentService {
    contentExplosion;
    hookOptimizer;
    signalRanker;
    hotScore;
    matchesService;
    logger = new common_1.Logger(ContentAgentService_1.name);
    constructor(contentExplosion, hookOptimizer, signalRanker, hotScore, matchesService) {
        this.contentExplosion = contentExplosion;
        this.hookOptimizer = hookOptimizer;
        this.signalRanker = signalRanker;
        this.hotScore = hotScore;
        this.matchesService = matchesService;
    }
    /**
     * Execute content generation based on strategy.
     */
    async execute(strategy) {
        const errors = [];
        let generatedCount = 0;
        this.logger.log(`[ContentAgent] Executing: ${strategy.matchCoverage.selectedForContent} matches → ` +
            `${strategy.contentPlan.contentPiecesTarget} pieces target`);
        // For each selected match, explode to platforms
        for (const matchId of strategy.matchCoverage.topMatchIds) {
            try {
                const match = await this.matchesService.findById(matchId);
                if (!match) {
                    errors.push(`Match ${matchId} not found`);
                    continue;
                }
                // Build hot score input for the explosion
                const signal = {
                    matchId: match.id,
                    homeTeam: match.home_team?.name || 'Unknown',
                    awayTeam: match.away_team?.name || 'Unknown',
                    competition: match.competition?.name || 'World Cup',
                    tournamentStage: match.round?.includes('Group') ? 'group' : 'knockout',
                    homeScore: match.home_score || undefined,
                    awayScore: match.away_score || undefined,
                    status: match.status,
                    starPlayers: [], // Simplified — real impl pulls from DB
                    totalGoals: (match.home_score || 0) + (match.away_score || 0),
                };
                const score = this.hotScore.calculate(signal);
                const explosiveSignal = {
                    ...score,
                    matchData: signal,
                    triggeredAt: new Date(),
                };
                // Submit to ranker → triggers ContentExplosionService.onExplosiveSignal
                this.signalRanker.submitUrgent(signal);
                generatedCount++;
                this.logger.log(`[ContentAgent] 💥 Explosion: ${signal.homeTeam} vs ${signal.awayTeam} ` +
                    `(score=${score.totalScore} tier=${score.tier})`);
            }
            catch (err) {
                errors.push(`Match ${matchId}: ${err.message}`);
                this.logger.error(`[ContentAgent] Error processing ${matchId}`, err);
            }
        }
        const report = {
            timestamp: new Date(),
            matchesProcessed: strategy.matchCoverage.selectedForContent,
            contentPiecesGenerated: generatedCount * strategy.contentPlan.platforms.length,
            platformsUsed: strategy.contentPlan.platforms,
            primaryContentType: strategy.contentPlan.primaryContentType,
            hooksApplied: strategy.contentPlan.hooksToUse,
            errors,
            summary: errors.length === 0
                ? `成功为 ${generatedCount} 场比赛生成 ${generatedCount * strategy.contentPlan.platforms.length} 条内容`
                : `生成了 ${generatedCount} 条内容，${errors.length} 个错误`,
        };
        return report;
    }
};
exports.ContentAgentService = ContentAgentService;
exports.ContentAgentService = ContentAgentService = ContentAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [content_explosion_service_1.ContentExplosionService,
        hook_optimizer_service_1.HookOptimizerService,
        signal_ranker_service_1.SignalRankerService,
        hot_score_service_1.HotScoreService,
        matches_service_1.MatchesService])
], ContentAgentService);
//# sourceMappingURL=content-agent.service.js.map