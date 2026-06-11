import { Injectable } from '@nestjs/common';
import { PricingTestService } from './pricing-test.service';

/**
 * DecisionValueService — positions AI Sports OS as a "decision engine",
 * not a "data tool". Every upgrade prompt answers: "What better decision
 * can you make with Pro that you can't make with Free?"
 *
 * Three decision layers:
 *   Free  → Know WHAT happened
 *   Pro   → Understand WHY + predict WHAT WILL happen
 *   Elite → Simulate WHAT IF + optimize decisions
 */

export interface UpgradePage {
  hero: {
    headline: string;
    subheadline: string;
    decisionQuestion: string;
  };
  comparison: Array<{
    feature: string;
    free: string;
    pro: string;
    elite: string;
    isDecisionFeature: boolean; // True = directly helps make a judgment
  }>;
  socialProof: {
    format: string;
    text: string;
  };
  faq: Array<{ q: string; a: string }>;
  urgency: {
    type: 'worldcup_countdown' | 'limited_offer' | 'none';
    message: string;
  };
}

@Injectable()
export class DecisionValueService {
  constructor(private readonly pricingTest: PricingTestService) {}

  /**
   * Build the upgrade page — decision-system positioning.
   */
  buildUpgradePage(userId: string): UpgradePage {
    const pricing = this.pricingTest.getPricingForUser(userId);

    return {
      hero: {
        headline: '不只是看比赛。做出更好的判断。',
        subheadline: `Free 告诉你发生了什么。Pro 用 AI 帮你分析为什么、预测下一步。Elite 让你在别人还在猜的时候，已经做出决策。`,
        decisionQuestion: '下一场比赛，你准备靠猜，还是靠 AI？',
      },
      comparison: [
        {
          feature: '比赛结果',
          free: '✅ 比分 + 事件时间线',
          pro: '✅ 比分 + 事件 + AI 解读',
          elite: '✅ 完整情报 + 多角度复盘',
          isDecisionFeature: false,
        },
        {
          feature: '谁会赢？',
          free: '🔒 无预测',
          pro: `✅ 胜率预测 + 信心指数 — $${pricing.pro.monthly}/月`,
          elite: `✅ 预测 + 多场景模拟 — $${pricing.elite.monthly}/月`,
          isDecisionFeature: true,
        },
        {
          feature: '为什么赢/输？',
          free: '🔒 无战术分析',
          pro: '✅ 战术拆解 + 球员评分 0-10',
          elite: '✅ 战术 + 教练博弈 + 趋势',
          isDecisionFeature: true,
        },
        {
          feature: '会爆冷吗？',
          free: '🔒 无风险分析',
          pro: '✅ 冷门风险指数 + 关键因子',
          elite: '✅ 风险 + 多场景推演',
          isDecisionFeature: true,
        },
        {
          feature: '谁可能晋级？',
          free: '🔒 无模拟',
          pro: '🔒 无模拟',
          elite: '✅ 小组/淘汰赛概率推演',
          isDecisionFeature: true,
        },
        {
          feature: '每日 AI 分析',
          free: '3 次/天',
          pro: '50 次/天',
          elite: '无限制',
          isDecisionFeature: false,
        },
      ],
      socialProof: {
        format: 'quote',
        text: '「以前看球靠感觉，现在用 AI Sports OS 看完分析再下判断，准确率高太多了」— Pro 用户',
      },
      faq: [
        { q: 'Pro 和 Free 最大的区别是什么？', a: 'Free 告诉你比分和基本信息。Pro 用 AI 帮你分析谁会赢、为什么、风险在哪——帮你做判断，不只是看数据。' },
        { q: '预测准确吗？', a: 'AI 预测基于 20+ 维度数据。预测仅供参考，不构成博彩建议。Pro 用户反馈：决策参考价值远高于纯看数据。' },
        { q: '可以随时取消吗？', a: '可以。随时取消，次月不再续费。' },
        { q: '为什么 Pro 和 Elite 差这么多？', a: 'Elite 提供"模拟推演"——如果核心球员受伤会怎样？如果换阵型呢？这是决策者级别的功能。' },
      ],
      urgency: {
        type: 'worldcup_countdown',
        message: '世界杯期间，每场比赛都可能是淘汰赛。别让关键比赛靠猜。',
      },
    };
  }

  /**
   * Generate a contextual upgrade CTA based on what the user just asked.
   */
  getContextualCTA(trigger: string, pricing: { monthly: number }): {
    headline: string;
    body: string;
    buttonText: string;
    urgency: 'low' | 'medium' | 'high';
  } {
    const ctas: Record<string, any> = {
      prediction: {
        headline: '想知道谁会赢？',
        body: `Pro 提供 AI 胜率预测 + 信心指数 + 冷门预警。$${pricing.monthly}/月，比猜错了划算。`,
        buttonText: `解锁预测 — $${pricing.monthly}/月`,
        urgency: 'high',
      },
      tactics: {
        headline: '想看懂战术？',
        body: 'Pro 拆解阵型、压迫策略、空间利用。看完你比解说员还懂。',
        buttonText: '解锁战术分析',
        urgency: 'medium',
      },
      high_usage: {
        headline: '今天已经问了很多…',
        body: `你显然需要深度分析。$${pricing.monthly}/月无限追问，不再被限制打断思路。`,
        buttonText: '升级 — 无限追问',
        urgency: 'medium',
      },
      key_match: {
        headline: '关键比赛，别靠猜。',
        body: '淘汰赛/决赛，每一个判断都值钱。Pro 给你 AI 级别的决策支持。',
        buttonText: '获取决胜情报',
        urgency: 'high',
      },
    };

    return ctas[trigger] || ctas.prediction;
  }
}
