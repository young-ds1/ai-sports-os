import { Injectable } from '@nestjs/common';
import { SubscriptionTier } from '../users/subscriptions/tier-config';

/**
 * TieredResponseService — the core of monetization.
 *
 * Free users get "decision-ready but incomplete" analysis.
 * They see the VALUE of AI analysis, but the BEST parts are locked.
 *
 * This is NOT a hard paywall — it's a "value gradient":
 *   Free  → Shows WHAT happened (data summary)
 *   Pro   → Explains WHY it happened (tactical breakdown)
 *   Elite → Predicts what WILL happen (simulations, trends)
 */

export interface TieredPrompt {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  features: string[];
  lockedFeatures: string[];
}

export interface TieredAnalysis {
  // All tiers get this
  common: {
    summary: string;
    recent_form: string;
    key_player_names: string[];
  };
  // Pro+
  pro?: {
    tactical_breakdown: string;
    player_performance_scores: Record<string, number>;
    win_probability: { home: number; draw: number; away: number };
    confidence_index: number;
    upset_risk: string;
  };
  // Elite
  elite?: {
    simulations: string;
    group_advancement_odds: string;
    trend_analysis: string;
    lineup_optimization: string;
  };
  // Metadata
  meta: {
    tier: string;
    features_unlocked: string[];
    features_locked: string[];
    upgrade_cta?: string;
  };
}

@Injectable()
export class TieredResponseService {
  /**
   * Build prompt parameters based on user tier.
   * Free gets basic analysis. Pro/Elite get exponentially more depth.
   */
  getPromptConfig(tier: string, questionType: string): TieredPrompt {
    const allFeatures = [
      '赛事摘要', '近期状态', '关键球员', '战术拆解',
      '球员评分', '胜率预测', '风险分析', '模拟推演',
    ];

    switch (tier) {
      case SubscriptionTier.FREE:
        return {
          systemPrompt: this.freeSystemPrompt(),
          userPrompt: questionType,
          temperature: 0.7,
          maxTokens: 800,
          features: allFeatures.slice(0, 3),    // 摘要 + 状态 + 球员名
          lockedFeatures: allFeatures.slice(3),   // 其余锁住
        };

      case SubscriptionTier.VIP:
        return {
          systemPrompt: this.proSystemPrompt(),
          userPrompt: questionType,
          temperature: 0.7,
          maxTokens: 2000,
          features: allFeatures.slice(0, 7),     // 除了模拟推演全解锁
          lockedFeatures: allFeatures.slice(7),
        };

      case SubscriptionTier.PRO:
        return {
          systemPrompt: this.eliteSystemPrompt(),
          userPrompt: questionType,
          temperature: 0.8,
          maxTokens: 3000,
          features: allFeatures,                  // 全部解锁
          lockedFeatures: [],
        };

      default:
        return this.getPromptConfig(SubscriptionTier.FREE, questionType);
    }
  }

  /**
   * Post-process AI output to add/remove layers based on tier.
   * Free users see a "preview" of locked sections.
   */
  tierify(rawOutput: string, tier: string): TieredAnalysis {
    const common = this.extractCommon(rawOutput);

    const result: TieredAnalysis = {
      common,
      meta: { tier, features_unlocked: [], features_locked: [] },
    };

    if (tier === SubscriptionTier.FREE) {
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

    if (tier === SubscriptionTier.VIP) {
      result.pro = this.extractPro(rawOutput);
      result.meta = {
        tier: 'vip',
        features_unlocked: ['赛事摘要', '近期状态', '关键球员', '战术拆解', '球员评分', '胜率预测', '风险分析'],
        features_locked: ['多场模拟推演', '小组出线概率'],
        upgrade_cta: '🔓 升级 Elite 解锁模拟推演 + 趋势分析',
      };
    }

    if (tier === SubscriptionTier.PRO) {
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

  private freeSystemPrompt(): string {
    return `You are a sports analysis assistant for AI Sports OS (Free tier).
Provide CONCISE match analysis in Chinese (zh-CN).
Include: basic summary, recent form, key player NAMES only (no detailed stats).
Keep it short — Free users get essentials, Pro users get depth.
DO NOT fabricate exact numbers. Use ranges like "high" / "moderate" instead of specific scores.`;
  }

  private proSystemPrompt(): string {
    return `You are an EXPERT sports analyst for AI Sports OS (Pro tier).
Provide COMPREHENSIVE match analysis in Chinese (zh-CN).
Include ALL of: summary, detailed form analysis, tactical breakdown, player performance scores (0-10 scale), win/draw/loss probability (percentages), risk factors, confidence index.
Use specific numbers and data points. Be analytical, not generic.
The user pays for depth — deliver it.`;
  }

  private eliteSystemPrompt(): string {
    return `You are an ELITE sports intelligence analyst for AI Sports OS (Elite tier).
Provide the MOST ADVANCED analysis available.
Include everything Pro does, PLUS: multi-scenario simulation, group advancement odds, tactical trend analysis, lineup optimization suggestions.
Think like a data scientist + coach hybrid. Use probabilistic language where appropriate.
The user pays premium — deliver insights they can't get anywhere else.`;
  }

  // ── Content extraction (simplified — real impl uses structured JSON mode) ──

  private extractCommon(raw: string) {
    const lines = raw.split('\n').filter(l => l.trim());
    return {
      summary: lines.slice(0, 3).join('\n'),
      recent_form: lines.find(l => l.includes('状态') || l.includes('form') || l.includes('近')) || '',
      key_player_names: this.extractPlayerNames(raw),
    };
  }

  private extractPro(raw: string) {
    return {
      tactical_breakdown: raw.substring(raw.length / 2),
      player_performance_scores: {},
      win_probability: { home: 0.45, draw: 0.25, away: 0.30 },
      confidence_index: 72,
      upset_risk: 'moderate',
    };
  }

  private extractElite(raw: string) {
    return {
      simulations: 'Multi-scenario analysis based on current form...',
      group_advancement_odds: '',
      trend_analysis: '',
      lineup_optimization: '',
    };
  }

  private extractPlayerNames(raw: string): string[] {
    // Extract capitalized names — simplified
    const namePattern = /(Messi|Ronaldo|Mbappé|Musiala|Yamal|Bellingham|Vinicius|Pedri|Wirtz|Havertz|Rodrygo|Álvarez)/g;
    return [...new Set(raw.match(namePattern) || [])];
  }
}
