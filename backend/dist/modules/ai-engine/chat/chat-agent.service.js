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
var ChatAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatAgentService = void 0;
const common_1 = require("@nestjs/common");
const matches_service_1 = require("../../domain/matches/matches.service");
const players_service_1 = require("../../domain/players/players.service");
const ai_cache_service_1 = require("../cache/ai-cache.service");
const openai_service_1 = require("../engines/openai.service");
const prompt_builder_service_1 = require("../engines/prompt-builder.service");
const source_tracer_service_1 = require("../engines/source-tracer.service");
let ChatAgentService = ChatAgentService_1 = class ChatAgentService {
    matchesService;
    playersService;
    cacheService;
    openai;
    promptBuilder;
    tracer;
    logger = new common_1.Logger(ChatAgentService_1.name);
    constructor(matchesService, playersService, cacheService, openai, promptBuilder, tracer) {
        this.matchesService = matchesService;
        this.playersService = playersService;
        this.cacheService = cacheService;
        this.openai = openai;
        this.promptBuilder = promptBuilder;
        this.tracer = tracer;
    }
    async answer(userMessage, context) {
        // Step 1: Query the database for factual data
        const dbResult = await this.queryDatabase(userMessage, context);
        if (dbResult) {
            return { message: dbResult.answer, sources: dbResult.sources, confidence: 95 };
        }
        // Step 2: Check AI analysis cache
        if (context.matchId) {
            const cached = await this.cacheService.getAnalysis(context.matchId);
            if (cached) {
                return {
                    message: `根据已有的AI分析：${cached.summary || JSON.stringify(cached).substring(0, 500)}`,
                    sources: [this.tracer.cacheSource(context.matchId)],
                    confidence: 80,
                };
            }
        }
        // Step 3: LLM inference (last resort)
        const dbContext = await this.buildContext(context);
        const prompt = this.promptBuilder.buildChatPrompt(userMessage, dbContext);
        const llm = await this.openai.chat([
            { role: 'system', content: 'You are an expert sports analyst. Be accurate and honest.' },
            { role: 'user', content: prompt },
        ]);
        return {
            message: llm.answer,
            sources: [this.tracer.llmSource(llm.model)],
            confidence: 60,
        };
    }
    /**
     * Query the domain database for factual answers.
     * Returns null if the question requires reasoning beyond DB lookup.
     */
    async queryDatabase(message, context) {
        const msg = message.toLowerCase();
        // "How many goals did X score?" → match_events
        if (msg.includes('进球') || msg.includes('goal') || msg.includes('score')) {
            if (context.matchId) {
                const match = await this.matchesService.findById(context.matchId);
                if (match) {
                    const goalEvents = match.events?.filter(e => e.type === 'goal' || e.type === 'penalty_goal') || [];
                    if (goalEvents.length > 0) {
                        const summary = goalEvents
                            .map(e => `${e.minute}' ${e.comment}`)
                            .join('；');
                        return {
                            answer: `本场比赛共 ${goalEvents.length} 个进球：${summary}`,
                            sources: [this.tracer.dbSource('match_events')],
                        };
                    }
                    return {
                        answer: `本场比赛目前没有进球事件。比分为 ${match.home_team?.name || '主队'} ${match.home_score || 0} - ${match.away_score || 0} ${match.away_team?.name || '客队'}`,
                        sources: [this.tracer.dbSource('matches', 'home_score')],
                    };
                }
            }
        }
        // "What's the score?" → matches
        if (msg.includes('比分') || msg.includes('几比几') || msg.includes('score')) {
            if (context.matchId) {
                const match = await this.matchesService.findById(context.matchId);
                if (match) {
                    return {
                        answer: `${match.home_team?.name || '主队'} ${match.home_score || 0} - ${match.away_score || 0} ${match.away_team?.name || '客队'}（${match.status === 'live' ? `进行中 ${match.elapsed_minute}'` : match.status === 'finished' ? '已结束' : '未开始'}）`,
                        sources: [this.tracer.dbSource('matches', 'home_score,away_score,status')],
                    };
                }
            }
        }
        // "What matches today?" → matches
        if (msg.includes('今天') || msg.includes('今日') || msg.includes('today')) {
            const today = new Date().toISOString().split('T')[0];
            const matches = await this.matchesService.findByDate(today);
            if (matches.length > 0) {
                const list = matches
                    .map(m => `• ${m.home_team?.name || '?'} vs ${m.away_team?.name || '?'} — ${m.kickoff_time || 'TBD'} (${m.status})`)
                    .join('\n');
                return {
                    answer: `今天共有 ${matches.length} 场比赛：\n${list}`,
                    sources: [this.tracer.dbSource('matches')],
                };
            }
            return {
                answer: '今天暂无比赛安排。',
                sources: [this.tracer.dbSource('matches')],
            };
        }
        return null; // Requires LLM reasoning
    }
    async buildContext(context) {
        const parts = [];
        if (context.matchId) {
            const match = await this.matchesService.findById(context.matchId);
            if (match) {
                parts.push(`MATCH: ${match.home_team?.name} ${match.home_score || 0}-${match.away_score || 0} ${match.away_team?.name}`);
                parts.push(`COMPETITION: ${match.competition?.name}`);
                parts.push(`STATUS: ${match.status}`);
                parts.push(`VENUE: ${match.venue || 'Unknown'}`);
                const goals = match.events?.filter(e => e.type === 'goal') || [];
                parts.push(`GOALS: ${goals.map(g => `${g.minute}' ${g.comment}`).join(', ') || 'None'}`);
                parts.push(`STATS: ${JSON.stringify(match.stats_summary || {})}`);
            }
        }
        // Fallback: today's matches
        if (parts.length === 0) {
            const today = new Date().toISOString().split('T')[0];
            const matches = await this.matchesService.findByDate(today);
            parts.push(`TODAY'S MATCHES: ${matches.length} matches scheduled`);
        }
        return parts.join('\n');
    }
};
exports.ChatAgentService = ChatAgentService;
exports.ChatAgentService = ChatAgentService = ChatAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [matches_service_1.MatchesService,
        players_service_1.PlayersService,
        ai_cache_service_1.AiCacheService,
        openai_service_1.OpenaiService,
        prompt_builder_service_1.PromptBuilderService,
        source_tracer_service_1.SourceTracerService])
], ChatAgentService);
//# sourceMappingURL=chat-agent.service.js.map