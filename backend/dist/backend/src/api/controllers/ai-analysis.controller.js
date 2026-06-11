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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAnalysisController = void 0;
const common_1 = require("@nestjs/common");
const analysis_service_1 = require("../../../../modules/ai-engine/analysis/analysis.service");
const ai_cache_service_1 = require("../../../../modules/ai-engine/cache/ai-cache.service");
const openai_service_1 = require("../../../../modules/ai-engine/engines/openai.service");
const prompt_builder_service_1 = require("../../../../modules/ai-engine/engines/prompt-builder.service");
const matches_service_1 = require("../../../../modules/domain/matches/matches.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let AiAnalysisController = class AiAnalysisController {
    analysisService;
    cacheService;
    openai;
    promptBuilder;
    matchesService;
    constructor(analysisService, cacheService, openai, promptBuilder, matchesService) {
        this.analysisService = analysisService;
        this.cacheService = cacheService;
        this.openai = openai;
        this.promptBuilder = promptBuilder;
        this.matchesService = matchesService;
    }
    async getAnalysis(matchId) {
        // Step 1: Check Redis cache
        const cached = await this.cacheService.getAnalysis(matchId);
        if (cached) {
            return { data: cached, source: 'cache' };
        }
        // Step 2: Check database
        const existing = await this.analysisService.getByMatch(matchId);
        if (existing) {
            // Refresh cache
            await this.cacheService.setAnalysis(matchId, existing.content);
            return { data: existing.content, source: 'database' };
        }
        // Step 3: Generate new analysis (fallback — normally pre-generated)
        const match = await this.matchesService.findById(matchId);
        if (!match)
            return { error: 'Match not found' };
        const context = {
            home_team: match.home_team?.name || 'Unknown',
            away_team: match.away_team?.name || 'Unknown',
            competition: match.competition?.name || 'Unknown',
            match_date: match.match_date,
            status: match.status,
            home_score: match.home_score,
            away_score: match.away_score,
            stats: match.stats_summary,
            events: match.events?.map(e => ({ type: e.type, minute: e.minute, comment: e.comment })),
        };
        const prompt = this.promptBuilder.buildAnalysisPrompt(context, match.status === 'finished' ? 'post_match' : 'pre_match');
        const result = await this.openai.chat([
            { role: 'system', content: prompt },
        ]);
        const content = { summary: result.answer, generated_at: new Date().toISOString() };
        // Save to database
        await this.analysisService.create({
            match_id: matchId,
            analysis_type: match.status === 'finished' ? 'post_match' : 'pre_match',
            content,
            model_version: result.model,
            tokens_used: result.tokensUsed,
            confidence_score: 75,
            input_context: { match_id: matchId },
            expires_at: new Date(Date.now() + 24 * 3600 * 1000),
        });
        // Cache
        await this.cacheService.setAnalysis(matchId, content);
        return { data: content, source: 'generated' };
    }
};
exports.AiAnalysisController = AiAnalysisController;
__decorate([
    (0, common_1.Get)(':matchId'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiAnalysisController.prototype, "getAnalysis", null);
exports.AiAnalysisController = AiAnalysisController = __decorate([
    (0, common_1.Controller)('api/ai/analysis'),
    __metadata("design:paramtypes", [analysis_service_1.AnalysisService,
        ai_cache_service_1.AiCacheService,
        openai_service_1.OpenaiService,
        prompt_builder_service_1.PromptBuilderService,
        matches_service_1.MatchesService])
], AiAnalysisController);
//# sourceMappingURL=ai-analysis.controller.js.map