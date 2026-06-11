import { Injectable } from '@nestjs/common';

/**
 * PreviewTeaserService — generates the "locked content preview" that Free users see.
 *
 * Key principle: Show the STRUCTURE of what Pro unlocks without giving the VALUE.
 * Like a blurred image preview — you see there's something there, but you can't read it.
 *
 * Three types of teasers:
 * 1. BlurPreview — shows section headers with lock icons
 * 2. StatPreview — shows labels without values
 * 3. TrendPreview — shows axis labels without the chart
 */

export interface TeaserSection {
  title: string;
  icon: string;
  description: string;
  freePreview: string;     // What free users see
  proValue: string;        // What Pro unlocks
  conversionHook: string;  // Why upgrade NOW
}

@Injectable()
export class PreviewTeaserService {
  private teasers: TeaserSection[] = [
    {
      title: '胜率预测',
      icon: '🔮',
      description: 'AI 基于 20+ 维度计算的胜平负概率',
      freePreview: '主队胜率：🔒  \n平局概率：🔒  \n客队胜率：🔒',
      proValue: '主队胜率：62%  \n平局概率：22%  \n客队胜率：16%',
      conversionHook: '想知道这场谁会赢？',
    },
    {
      title: '球员表现评分',
      icon: '⭐',
      description: '每个球员的量化表现评分（0-10 分）',
      freePreview: '最佳球员：🔒  \n评分：🔒/10  \n关键贡献：🔒',
      proValue: '最佳球员：Messi  \n评分：8.6/10  \n关键贡献：2球1助',
      conversionHook: 'Messi 这场到底踢得怎么样？',
    },
    {
      title: '战术深度拆解',
      icon: '🧠',
      description: '阵型变化、压迫策略、空间利用分析',
      freePreview: '主队战术：🔒  \n客队应对：🔒  \n关键博弈点：🔒',
      proValue: '主队战术：4-3-3 高位压迫，利用边路宽度  \n客队应对：5-3-2 收缩反击  \n关键博弈点：中场第二落点争夺',
      conversionHook: '教练到底在打什么算盘？',
    },
    {
      title: '冷门风险指数',
      icon: '⚠️',
      description: 'AI 识别的潜在爆冷风险因素',
      freePreview: '风险等级：🔒  \n关键风险因素：🔒  \n历史相似比赛：🔒',
      proValue: '风险等级：中等偏高 (65/100)  \n关键风险因素：主力后卫黄牌停赛  \n历史相似比赛：12场中4场爆冷',
      conversionHook: '这场比赛会爆冷吗？',
    },
  ];

  /**
   * Generate a teaser block for a specific feature category.
   */
  getTeaser(category: string): TeaserSection | null {
    return this.teasers.find(t =>
      t.title.includes(category) || t.icon.includes(category),
    ) || this.teasers[0]; // Default to predictions
  }

  /**
   * Generate a complete "upgrade prompt" card with multiple teasers.
   */
  getUpgradePrompt(unlockedCount: number, totalCount: number): string {
    const teasers = this.teasers.slice(0, 3);

    const lines = [
      `---`,
      `### 🔓 已解锁 ${unlockedCount}/${totalCount} 项分析功能`,
      ``,
      ...teasers.flatMap(t => [
        `**${t.icon} ${t.title}**`,
        `├─ ${t.freePreview.split('\n').join('\n├─ ')}`,
        ``,
      ]),
      `> ${teasers[0]?.conversionHook || '想获取完整分析？'}`,
      ``,
      `[🔓 升级 Pro — 解锁全部 ${totalCount} 项功能](/user/upgrade)`,
    ];

    return lines.join('\n');
  }

  /**
   * Generate a teaser response for when a Free user hits a premium question.
   * This is appended to their AI response.
   */
  buildPaywallResponse(triggerCategory: string): {
    message: string;
    teaser: TeaserSection;
    cta: { text: string; url: string; urgency: 'low' | 'medium' | 'high' };
  } {
    const teaser = this.getTeaser(triggerCategory)!;

    const urgencyMap: Record<string, 'low' | 'medium' | 'high'> = {
      prediction: 'high',    // "Who will win" → high urgency
      tactics: 'medium',
      high_usage: 'medium',
      key_match: 'high',     // Final/semi → high urgency
    };

    return {
      message: [
        `💡 **${teaser.conversionHook}**`,
        ``,
        `Pro 会员可以看到：`,
        `• ${teaser.proValue.split('\n').join('\n• ')}`,
        ``,
        `👉 [升级 Pro 立即查看](/user/upgrade)`,
      ].join('\n'),
      teaser,
      cta: {
        text: teaser.conversionHook,
        url: '/user/upgrade',
        urgency: urgencyMap[triggerCategory] || 'medium',
      },
    };
  }

  /**
   * Get all teaser sections (for the upgrade page).
   */
  getAllTeasers(): TeaserSection[] {
    return this.teasers;
  }
}
