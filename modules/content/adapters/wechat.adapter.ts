import { Injectable } from '@nestjs/common';
import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';

/**
 * 公众号 Adapter — 深度内容，信息量大，适合转发
 *
 * 规则：
 * - 标题 15-30 字，信息量大（不是标题党，是信息密度高）
 * - 开头有导语 (lead paragraph)
 * - 正文 800-2000 字，结构清晰
 * - H2 分段，每段 3-5 句
 * - 结尾加「阅读原文」/「关注」引导
 * - 封面图 prompt 单独生成
 */
@Injectable()
export class WechatAdapter implements PlatformAdapter {
  readonly platform = 'wechat';
  readonly maxLength = 2000;
  readonly bestTimeUTC = '12:30'; // 北京时间 20:30
  readonly format = 'markdown';

  async adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent> {
    const matchData = context.matchData;
    const scoreStr = matchData?.homeScore != null
      ? `${matchData.homeTeam} ${matchData.homeScore}-${matchData.awayScore} ${matchData.awayTeam}`
      : `${matchData?.homeTeam || '?'} vs ${matchData?.awayTeam || '?'}`;

    // Build title — informative, high density
    const title = matchData?.homeScore != null
      ? `${scoreStr}：${this.extractKeyInsight(aiRawOutput)}`
      : `${scoreStr}前瞻：${this.extractKeyInsight(aiRawOutput)}`;

    // Build article
    const parts: string[] = [];

    // Lead
    parts.push(`> ${scoreStr}。AI Sports OS 为您带来深度分析与关键洞察。`);
    parts.push('');

    // Process AI output into structured sections
    const content = aiRawOutput
      .replace(/^#\s+(.*)$/gm, '## $1') // Normalize headers to H2
      .replace(/\*\*(.*?)\*\*/g, '**$1**');

    parts.push(content);

    // Footer
    parts.push('');
    parts.push('---');
    parts.push('*本文由 AI Sports OS 自动生成。查看完整 AI 分析与预测，请访问 →*');
    parts.push('');
    parts.push('👆 点击关注，获取每日世界杯 AI 深度分析');

    const hashtags = ['世界杯', 'AI分析', '赛事复盘'];

    return {
      title: title.substring(0, 50),
      body: parts.join('\n'),
      format: 'markdown',
      hashtags,
      characterCount: parts.join('').length,
    };
  }

  private extractKeyInsight(text: string): string {
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    // Find the most insightful line (contains numbers or specific terms)
    const insight = lines.find(l =>
      /\d+/.test(l) && (l.includes('表现') || l.includes('关键') || l.includes('数据') || l.includes('战术'))
    );
    if (insight) {
      return insight.replace(/^#+\s*/, '').replace(/\*\*/g, '').substring(0, 30);
    }
    return lines[0]?.replace(/^#+\s*/, '').substring(0, 30) || '深度分析';
  }
}
