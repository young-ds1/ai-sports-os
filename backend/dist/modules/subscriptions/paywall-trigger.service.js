"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PaywallTriggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaywallTriggerService = void 0;
const common_1 = require("@nestjs/common");
// Question patterns that indicate conversion intent
const PREDICTION_PATTERNS = [
    /谁会赢/, /谁能赢/, /预测/, /predict/, /胜率/, /概率/,
    /比分.*预测/, /谁会晋级/, /冠军.*谁/, /哪队.*强/,
];
const TACTICS_PATTERNS = [
    /战术/, /阵型/, /打法/, /tactic/, /formation/,
    /如何克制/, /怎么.*防/, /弱点/, /优势.*在/,
    /为什么.*输/, /为什么.*表现/, /问题出在/,
];
const KEY_MATCH_INDICATORS = [
    'quarter', 'semi', 'final', '决赛', '半决赛', '四强',
    '淘汰赛', '小组出线', '晋级',
];
let PaywallTriggerService = PaywallTriggerService_1 = class PaywallTriggerService {
    logger = new common_1.Logger(PaywallTriggerService_1.name);
    /**
     * Analyze a user message for conversion potential.
     * Returns a trigger if the user is asking a premium-value question.
     */
    analyze(message, context) {
        if (context.userTier !== 'free')
            return null; // Already paying — no trigger
        const msg = message.toLowerCase();
        // 1. Prediction intent — highest conversion value
        const predictionMatch = PREDICTION_PATTERNS.some(p => p.test(message));
        if (predictionMatch) {
            return {
                triggered: true,
                reason: '用户询问预测类问题——这是最强的付费信号',
                category: 'prediction',
                previewSnippet: this.generatePredictionPreview(context.matchName),
                upgradeUrl: '/user/upgrade?feature=prediction',
                conversionPriority: 90,
            };
        }
        // 2. Tactics intent — moderate conversion value
        const tacticsMatch = TACTICS_PATTERNS.some(p => p.test(message));
        if (tacticsMatch) {
            return {
                triggered: true,
                reason: '用户询问战术深度分析',
                category: 'tactics',
                previewSnippet: this.generateTacticsPreview(context.matchName),
                upgradeUrl: '/user/upgrade?feature=tactics',
                conversionPriority: 70,
            };
        }
        // 3. v2: AI analysis threshold — user has viewed ≥2 AI analyses today
        if ((context.aiAnalysisViews || 0) >= 2) {
            return {
                triggered: true,
                reason: `用户今天已查看 ${context.aiAnalysisViews} 次 AI 分析——深度研究信号`,
                category: 'key_match',
                previewSnippet: this.generateAnalysisThresholdPreview(context.aiAnalysisViews || 2),
                upgradeUrl: '/user/upgrade?feature=deep_analysis',
                conversionPriority: 85,
            };
        }
        // 4. High usage — engagement signal
        if (context.consecutiveQuestions >= 3) {
            return {
                triggered: true,
                reason: `用户已连续提问 ${context.consecutiveQuestions} 次——高频使用信号`,
                category: 'high_usage',
                previewSnippet: this.generateHighUsagePreview(context.consecutiveQuestions),
                upgradeUrl: '/user/upgrade?feature=unlimited',
                conversionPriority: 60,
            };
        }
        // 5. Key match — tournament stakes
        const stageMatch = KEY_MATCH_INDICATORS.some(k => context.matchStage?.toLowerCase().includes(k) || msg.includes(k));
        if (stageMatch) {
            return {
                triggered: true,
                reason: '用户关注高价值赛事——决策需求强烈',
                category: 'key_match',
                previewSnippet: this.generateKeyMatchPreview(context.matchName, context.matchStage),
                upgradeUrl: '/user/upgrade?feature=deep_analysis',
                conversionPriority: 80,
            };
        }
        return null;
    }
    /**
     * Generate a preview snippet to show below the AI response.
     * This is the "teaser" — tells the user what Pro would have given them.
     */
    generatePredictionPreview(matchName) {
        const match = matchName || '本场比赛';
        return [
            `---`,
            `🔮 **Pro 用户可见**：`,
            `• ${match} 胜平负精确概率`,
            `• AI 信心指数（0-100）`,
            `• 冷门风险预警`,
            `• 历史相似比赛参考`,
            ``,
            `👉 [升级 Pro 解锁完整预测](/user/upgrade?feature=prediction)`,
        ].join('\n');
    }
    generateTacticsPreview(matchName) {
        const match = matchName || '本场';
        return [
            `---`,
            `🧠 **Pro 用户可见**：`,
            `• ${match} 完整战术拆解（阵型、打法、调整）`,
            `• 球员表现量化评分（0-10 分）`,
            `• 关键对决分析`,
            `• 教练战术博弈解读`,
            ``,
            `👉 [升级 Pro 解锁深度分析](/user/upgrade?feature=tactics)`,
        ].join('\n');
    }
    generateHighUsagePreview(count) {
        return [
            `---`,
            `💡 你已连续提问 ${count} 次——看来你是个深度球迷！`,
            ``,
            `**Pro 会员可享**：`,
            `• 每日 50 次 AI 分析（当前 3 次）`,
            `• 无限 AI 追问`,
            `• 预测 + 战术 + 评分全解锁`,
            ``,
            `👉 [升级 Pro，尽情提问](/user/upgrade?feature=unlimited)`,
        ].join('\n');
    }
    generateKeyMatchPreview(matchName, stage) {
        return [
            `---`,
            `🏆 ${stage || '关键比赛'} 值得深度分析。`,
            ``,
            `**Pro 会员专享**：`,
            `• 多场景模拟（如果 X 发生，结果会怎样？）`,
            `• 小组/淘汰赛晋级概率`,
            `• AI 战术推演`,
            ``,
            `👉 [升级 Pro 获取完整情报](/user/upgrade?feature=deep_analysis)`,
        ].join('\n');
    }
    generateAnalysisThresholdPreview(viewCount) {
        return [
            `---`,
            `📊 你今天已经查看了 ${viewCount} 次 AI 分析——看来你在认真研究这场比赛。`,
            ``,
            `**Pro 会员专享**：`,
            `• 无限 AI 分析（当前每日 3 次）`,
            `• 胜率预测 + 信心指数`,
            `• 球员表现量化评分（0-10 分）`,
            `• 战术深度拆解`,
            ``,
            `只用 3 次分析很难做出判断。升级 Pro，想查多少查多少。`,
            ``,
            `👉 [升级 Pro — 无限分析](/user/upgrade?feature=deep_analysis)`,
        ].join('\n');
    }
};
exports.PaywallTriggerService = PaywallTriggerService;
exports.PaywallTriggerService = PaywallTriggerService = PaywallTriggerService_1 = __decorate([
    (0, common_1.Injectable)()
], PaywallTriggerService);
//# sourceMappingURL=paywall-trigger.service.js.map