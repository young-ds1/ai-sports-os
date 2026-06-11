import { Injectable } from '@nestjs/common';
import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';

/**
 * SEO Long-form Adapter — 搜索引擎优化文章
 *
 * 规则：
 * - 标题含关键词 + 数字 + 年份 (e.g., "2026 World Cup: Argentina vs Brazil Full Analysis")
 * - Meta description 120-155 chars
 * - H2/H3 结构清晰
 * - 正文 800-2000 字
 * - 内链自然嵌入
 * - FAQ section at the end
 */
@Injectable()
export class SeoAdapter implements PlatformAdapter {
  readonly platform = 'seo';
  readonly maxLength = 3000;
  readonly bestTimeUTC = '06:00';
  readonly format = 'markdown';

  async adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent> {
    const matchData = context.matchData;
    const year = new Date().getFullYear();
    const scoreStr = matchData?.homeScore != null
      ? `${matchData.homeTeam} ${matchData.homeScore}-${matchData.awayScore} ${matchData.awayTeam}`
      : `${matchData?.homeTeam || '?'} vs ${matchData?.awayTeam || '?'}`;

    // SEO-optimized title
    const title = matchData?.homeScore != null
      ? `${year} 世界杯 ${scoreStr} 完整复盘 | AI 深度分析`
      : `${year} 世界杯 ${scoreStr} 赛前分析 | 阵容预测与战术解读`;

    // Meta description
    const metaDescription = `AI Sports OS 为您带来 ${year} 世界杯 ${scoreStr} 的完整分析。` +
      `包含战术复盘、关键球员表现、数据统计与AI预测。`.substring(0, 155);

    const parts: string[] = [];
    parts.push(`> **Meta Description**: ${metaDescription}`);
    parts.push('');

    // H1
    parts.push(`# ${title}`);
    parts.push('');

    // Intro paragraph (SEO: include keywords naturally)
    parts.push(`${year} 世界杯激战正酣。${scoreStr} 的比赛刚刚结束，` +
      `AI Sports OS 为您带来基于数据的完整分析——包括战术解读、关键球员表现与AI评分。`);
    parts.push('');

    // Process AI output preserving structure
    const content = aiRawOutput
      .replace(/^#\s+(.*)$/gm, '## $1')
      .replace(/^##\s+(.*)$/gm, '### $1');

    parts.push(content);

    // FAQ Section (SEO rich snippet target)
    parts.push('');
    parts.push('## 常见问题');
    parts.push('');
    parts.push(`### ${scoreStr} 谁赢了？`);
    parts.push(matchData?.homeScore != null
      ? `${matchData.homeScore > matchData.awayScore ? matchData.homeTeam : matchData.homeScore < matchData.awayScore ? matchData.awayTeam : '双方'} 取得了${matchData.homeScore === matchData.awayScore ? '平局' : '胜利'}。`
      : '比赛尚未进行。查看我们的赛前分析获取预测。');
    parts.push('');
    parts.push(`### 这场比赛哪个球员表现最好？`);
    parts.push('根据 AI 分析系统评分，本场最佳球员将在完整报告中揭晓。');
    parts.push('');
    parts.push(`### AI 如何分析 ${matchData?.competition || '世界杯'} 比赛？`);
    parts.push('AI Sports OS 通过分析射门、控球率、传球成功率等 20+ 维度数据，结合近期状态与交锋历史，生成结构化分析报告。');

    // CTA
    parts.push('');
    parts.push('---');
    parts.push(`👉 [查看 ${year} 世界杯全部比赛](/)`);
    parts.push(`👉 [使用 AI 体育问答](/chat)`);

    const hashtags = [matchData?.competition || 'WorldCup', 'AI Sports', 'Match Analysis'];

    return {
      title,
      body: parts.join('\n'),
      format: 'markdown',
      hashtags,
      characterCount: parts.join('').length,
    };
  }
}
