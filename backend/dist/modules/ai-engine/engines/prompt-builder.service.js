"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilderService = void 0;
const common_1 = require("@nestjs/common");
let PromptBuilderService = class PromptBuilderService {
    buildAnalysisPrompt(context, type) {
        const systemPrompt = `You are an expert sports analyst for AI Sports OS.
Provide structured, data-driven analysis. Never fabricate statistics.
If data is unavailable, say so honestly. Output in Chinese (zh-CN).
Format: Markdown with emoji section headers.`;
        const userPrompt = type === 'pre_match'
            ? this.buildPreMatchPrompt(context)
            : this.buildPostMatchPrompt(context);
        return `${systemPrompt}\n\n${userPrompt}`;
    }
    buildChatPrompt(userMessage, dbContext) {
        return `You are an expert sports analyst assistant. Answer the user's question based STRICTLY on the data provided below.
If the data doesn't contain the answer, say "暂无此数据" (No data available).
Never invent statistics or facts.

DATA CONTEXT:
${dbContext}

USER QUESTION: ${userMessage}

Answer in Chinese. Be concise. Cite specific data points.`;
    }
    buildPreMatchPrompt(context) {
        return `Generate a pre-match analysis for:
MATCH: ${context.home_team} vs ${context.away_team}
COMPETITION: ${context.competition}
DATE: ${context.match_date}
RECENT FORM HOME: ${context.recentForm?.home?.join(', ') || 'No data'}
RECENT FORM AWAY: ${context.recentForm?.away?.join(', ') || 'No data'}
HEAD TO HEAD: ${context.headToHead || 'No data'}

Include these sections:
1. 📊 近期状态 (Recent Form)
2. ⚔️ 攻防能力 (Attack & Defense Analysis)
3. 👤 关键球员 (Key Players)
4. 🧠 战术分析 (Tactical Analysis)
5. ⚠️ 风险因素 (Risk Factors)
6. 🎯 AI综合评分 (AI Comprehensive Score) — use a 0-100 scale
7. 💡 AI总结 (AI Summary)

For the comprehensive score, assign attack, defense, midfield, and overall ratings to both teams.`;
    }
    buildPostMatchPrompt(context) {
        return `Generate a post-match analysis for:
MATCH: ${context.home_team} ${context.home_score || 0} - ${context.away_score || 0} ${context.away_team}
COMPETITION: ${context.competition}
STATUS: ${context.status}
KEY EVENTS: ${context.events?.map(e => `${e.minute}' ${e.type}: ${e.comment}`).join(' | ') || 'No data'}
STATISTICS: ${JSON.stringify(context.stats || {})}

Include these sections:
1. 📊 比赛回顾 (Match Recap)
2. ⚽ 关键事件 (Key Events)
3. 👤 球员表现 (Player Performances)
4. 🧠 战术复盘 (Tactical Review)
5. 💡 赛后总结 (Post-Match Summary)
6. 🔮 后续展望 (Outlook)`;
    }
};
exports.PromptBuilderService = PromptBuilderService;
exports.PromptBuilderService = PromptBuilderService = __decorate([
    (0, common_1.Injectable)()
], PromptBuilderService);
//# sourceMappingURL=prompt-builder.service.js.map