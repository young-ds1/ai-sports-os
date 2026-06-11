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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OpenaiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
let OpenaiService = OpenaiService_1 = class OpenaiService {
    logger = new common_1.Logger(OpenaiService_1.name);
    client;
    constructor() {
        this.client = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key',
        });
    }
    async chat(messages, options) {
        const model = options?.model || 'gpt-4o';
        // Phase 3 MVP: when no API key is set, return mock AI response
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-mock-key') {
            return this.mockResponse(messages);
        }
        try {
            const response = await this.client.chat.completions.create({
                model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 2000,
            });
            return {
                answer: response.choices[0]?.message?.content || 'No response generated',
                model: response.model,
                tokensUsed: response.usage?.total_tokens || 0,
            };
        }
        catch (err) {
            this.logger.error('OpenAI API call failed', err);
            throw err;
        }
    }
    // Mock response for development without API key
    mockResponse(messages) {
        const userMsg = messages.find((m) => m.role === 'user')?.content || '';
        if (userMsg.includes('分析') || userMsg.includes('analysis')) {
            return {
                answer: `## AI 赛事分析报告

### 📊 近期状态
本场比赛双方近期表现有明显差异。主队近5场取得4胜，客队状态不佳。

### ⚔️ 攻防分析
主队进攻体系运转流畅，场均进球2.3个；客队防线存在明显漏洞。

### 👤 关键球员
主队核心球员近期状态火热，是比赛的关键变量。客队需要重点限制其发挥。

### 🧠 战术预测
预计主队将采用高位压迫战术，利用边路速度撕开防线。客队可能收缩防守，寻求反击机会。

### 💡 AI 总结
综合来看，主队占据明显优势，但足球比赛充满变数。本场比赛值得关注。`,
                model: 'gpt-4o-mock',
                tokensUsed: 0,
            };
        }
        return {
            answer: `Based on the available data: ${userMsg.substring(0, 100)}... I'd recommend checking the match details for comprehensive statistics and insights.`,
            model: 'gpt-4o-mock',
            tokensUsed: 0,
        };
    }
};
exports.OpenaiService = OpenaiService;
exports.OpenaiService = OpenaiService = OpenaiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OpenaiService);
//# sourceMappingURL=openai.service.js.map