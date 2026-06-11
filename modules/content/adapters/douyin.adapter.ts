import { Injectable } from '@nestjs/common';
import { PlatformAdapter, AdaptedContent, AdaptContext } from './platform.interface';

/**
 * 抖音/TikTok 脚本 Adapter
 *
 * 规则：
 * - 输出视频脚本格式（旁白 + 画面描述）
 * - 开头 3 秒钩子（必须是冲击力强的数据/画面）
 * - 总时长 30-60 秒（约 150-300 字口播）
 * - 脚本分「画面」+ 「口播」两列
 * - 结尾：引导点赞 + 关注
 */
@Injectable()
export class DouyinAdapter implements PlatformAdapter {
  readonly platform = 'douyin';
  readonly maxLength = 500;
  readonly bestTimeUTC = '12:00'; // 北京时间 20:00
  readonly format = 'script';

  async adapt(aiRawOutput: string, context: AdaptContext): Promise<AdaptedContent> {
    const matchData = context.matchData;
    const scoreStr = matchData?.homeScore != null
      ? `${matchData.homeScore}-${matchData.awayScore}`
      : '';

    const script: string[] = [];
    script.push('# 视频脚本');
    script.push(`## 标题备选：${this.generateTitle(matchData, scoreStr)}`);
    script.push('');

    // Timeline
    script.push('| 时间 | 画面 | 口播 |');
    script.push('|------|------|------|');

    // Hook (0-5s)
    const hook = this.buildHook(matchData, scoreStr, aiRawOutput);
    script.push(`| 0-5s | ${hook.visual} | ${hook.narration} |`);

    // Body (5-25s)
    const body = this.buildBody(aiRawOutput);
    script.push(`| 5-15s | ${body.visual1} | ${body.narration1} |`);
    script.push(`| 15-25s | ${body.visual2} | ${body.narration2} |`);

    // AI insight (25-35s)
    script.push(`| 25-35s | AI数据图表弹出 | ${this.extractAiInsight(aiRawOutput)} |`);

    // CTA (35-45s)
    script.push(`| 35-45s | 文字：「关注获取每日AI分析」 | 想看更多AI赛事分析？点赞关注，每天更新！🔔 |`);

    // Hashtags for video description
    const hashtags = ['世界杯', '足球', 'AI分析', '赛事解说', '比分'];

    return {
      title: `世界杯赛事速递`,
      body: script.join('\n'),
      format: 'script',
      hashtags,
      characterCount: script.join('').length,
    };
  }

  private generateTitle(matchData: any, score: string): string {
    if (!matchData?.homeTeam) return '今日世界杯神剧情！';
    return score
      ? `${matchData.homeTeam} ${score} ${matchData.awayTeam}，太刺激了！`
      : `${matchData.homeTeam} vs ${matchData.awayTeam} 赛前终极预测`;
  }

  private buildHook(matchData: any, score: string, aiOutput: string): { visual: string; narration: string } {
    const totalGoals = (matchData?.homeScore || 0) + (matchData?.awayScore || 0);
    if (totalGoals >= 5) {
      return {
        visual: '进球集锦快剪 + 比分大字弹出',
        narration: `${matchData.homeTeam} ${score} ${matchData.awayTeam}！${totalGoals}个进球，太疯狂了！`,
      };
    }
    return {
      visual: '比赛精彩镜头 + 数据卡片弹出',
      narration: `${matchData?.homeTeam || '？'}对${matchData?.awayTeam || '？'}，这场比赛改变了小组格局！`,
    };
  }

  private buildBody(aiOutput: string): { visual1: string; narration1: string; visual2: string; narration2: string } {
    const lines = aiOutput.replace(/^#.*$/gm, '').split('\n').filter(l => l.trim());
    return {
      visual1: '球员特写 + 数据标签动画',
      narration1: lines[0]?.substring(0, 80) || '比赛开局，双方就展开了激烈争夺。',
      visual2: '战术板动画演示',
      narration2: lines[1]?.substring(0, 80) || '关键转折点出现在下半场，教练的换人改变了比赛走势。',
    };
  }

  private extractAiInsight(aiOutput: string): string {
    const lines = aiOutput.split('\n').filter(l => l.includes('预测') || l.includes('数据') || l.includes('分析'));
    const line = lines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '').substring(0, 80);
    return line || '根据AI分析，这场比赛的关键在于中场的控制力。';
  }
}
