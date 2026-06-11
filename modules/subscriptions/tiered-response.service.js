"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TieredResponseService = void 0;
const common_1 = require("@nestjs/common");
const tier_config_1 = require("../users/subscriptions/tier-config");
let TieredResponseService = class TieredResponseService {
    /**
     * Build prompt parameters based on user tier.
     * Free gets basic analysis. Pro/Elite get exponentially more depth.
     */
    getPromptConfig(tier, questionType) {
        const allFeatures = [
            '赛事摘要', '近期状态', '关键球员', '战术拆解',
            '球员评分', '胜率预测', '风险分析', '模拟推演',
        ];
        switch (tier) {
            case tier_config_1.SubscriptionTier.FREE:
                return {
                    systemPrompt: this.freeSystemPrompt(),
                    userPrompt: questionType,
                    temperature: 0.7,
                    maxTokens: 800,
                    features: allFeatures.slice(0, 3), // 摘要 + 状态 + 球员名
                    lockedFeatures: allFeatures.slice(3), // 其余锁住
                };
            case tier_config_1.SubscriptionTier.VIP:
                return {
                    systemPrompt: this.proSystemPrompt(),
                    userPrompt: questionType,
                    temperature: 0.7,
                    maxTokens: 2000,
                    features: allFeatures.slice(0, 7), // 除了模拟推演全解锁
                    lockedFeatures: allFeatures.slice(7),
                };
            case tier_config_1.SubscriptionTier.PRO:
                return {
                    systemPrompt: this.eliteSystemPrompt(),
                    userPrompt: questionType,
                    temperature: 0.8,
                    maxTokens: 3000,
                    features: allFeatures, // 全部解锁
                    lockedFeatures: [],
                };
            default:
                return this.getPromptConfig(tier_config_1.SubscriptionTier.FREE, questionType);
        }
    }
    /**
     * Post-process AI output to add/remove layers based on tier.
     * Free users see a "preview" of locked sections.
     */
    tierify(rawOutput, tier) {
        const common = this.extractCommon(rawOutput);
        const result = {
            common,
            meta: { tier, features_unlocked: [], features_locked: [] },
        };
        if (tier === tier_config_1.SubscriptionTier.FREE) {
            // Free: show common only, add preview teasers
            result.meta = {
                tier: 'free',
                features_unlocked: ['赛事摘要', '近期状态', '关键球员名称'],
                features_locked: ['战术深度拆解', '球员表现评分', '胜平负概率预测', '冷门风险指数'],
                upgrade_cta: '🔓 升级 Pro 解锁胜率预测 + 战术拆解',
            };
            // Inject preview blurbs
            result.common.summary += '\n\n---\n🔒 **战术深度拆解** — 升级 Pro 解锁\n🔒 **胜平负概率预测** — 升级 Pro 解锁\n🔒 **球员表现量化评分** — 升级 Pro 解锁';
        }
        if (tier === tier_config_1.SubscriptionTier.VIP) {
            result.pro = this.extractPro(rawOutput);
            result.meta = {
                tier: 'vip',
                features_unlocked: ['赛事摘要', '近期状态', '关键球员', '战术拆解', '球员评分', '胜率预测', '风险分析'],
                features_locked: ['多场模拟推演', '小组出线概率'],
                upgrade_cta: '🔓 升级 Elite 解锁模拟推演 + 趋势分析',
            };
        }
        if (tier === tier_config_1.SubscriptionTier.PRO) {
            result.pro = this.extractPro(rawOutput);
            result.elite = this.extractElite(rawOutput);
            result.meta = {
                tier: 'pro',
                features_unlocked: ['全部功能已解锁'],
                features_locked: [],
            };
        }
        return result;
    }
    // ── Prompt templates ──
    freeSystemPrompt() {
        return `You are a sports analysis assistant for AI Sports OS (Free tier).
Provide CONCISE match analysis in Chinese (zh-CN).
Include: basic summary, recent form, key player NAMES only (no detailed stats).
Keep it short — Free users get essentials, Pro users get depth.
DO NOT fabricate exact numbers. Use ranges like "high" / "moderate" instead of specific scores.`;
    }
    proSystemPrompt() {
        return `You are an EXPERT sports analyst for AI Sports OS (Pro tier).
Provide COMPREHENSIVE match analysis in Chinese (zh-CN).
Include ALL of: summary, detailed form analysis, tactical breakdown, player performance scores (0-10 scale), win/draw/loss probability (percentages), risk factors, confidence index.
Use specific numbers and data points. Be analytical, not generic.
The user pays for depth — deliver it.`;
    }
    eliteSystemPrompt() {
        return `You are an ELITE sports intelligence analyst for AI Sports OS (Elite tier).
Provide the MOST ADVANCED analysis available.
Include everything Pro does, PLUS: multi-scenario simulation, group advancement odds, tactical trend analysis, lineup optimization suggestions.
Think like a data scientist + coach hybrid. Use probabilistic language where appropriate.
The user pays premium — deliver insights they can't get anywhere else.`;
    }
    // ── Content extraction (simplified — real impl uses structured JSON mode) ──
    extractCommon(raw) {
        const lines = raw.split('\n').filter(l => l.trim());
        return {
            summary: lines.slice(0, 3).join('\n'),
            recent_form: lines.find(l => l.includes('状态') || l.includes('form') || l.includes('近')) || '',
            key_player_names: this.extractPlayerNames(raw),
        };
    }
    extractPro(raw) {
        return {
            tactical_breakdown: raw.substring(raw.length / 2),
            player_performance_scores: {},
            win_probability: { home: 0.45, draw: 0.25, away: 0.30 },
            confidence_index: 72,
            upset_risk: 'moderate',
        };
    }
    extractElite(raw) {
        return {
            simulations: 'Multi-scenario analysis based on current form...',
            group_advancement_odds: '',
            trend_analysis: '',
            lineup_optimization: '',
        };
    }
    extractPlayerNames(raw) {
        // Extract capitalized names — simplified
        const namePattern = /(Messi|Ronaldo|Mbappé|Musiala|Yamal|Bellingham|Vinicius|Pedri|Wirtz|Havertz|Rodrygo|Álvarez)/g;
        return [...new Set(raw.match(namePattern) || [])];
    }
};
exports.TieredResponseService = TieredResponseService;
exports.TieredResponseService = TieredResponseService = __decorate([
    (0, common_1.Injectable)()
], TieredResponseService);
//# sourceMappingURL=tiered-response.service.js.map