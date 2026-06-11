import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RetentionEngineService } from './retention-engine.service';
import { StreakTrackerService } from './streak-tracker.service';
import { MatchesService } from '../domain/matches/matches.service';

/**
 * ReengagementService — brings dormant users back with event-driven triggers.
 *
 * Triggers:
 * - "Your team is playing tonight" → match-specific nudge
 * - "You have a 5-day streak — don't lose it!" → loss aversion
 * - "3 new AI analyses since you last visited" → FOMO
 * - "关键比赛今晚开打" → event-driven
 *
 * Output: structured notification payloads (can be sent via email/push/WeChat).
 */

export interface ReengagementNudge {
  userId: string;
  type: 'streak_risk' | 'team_match' | 'new_content' | 'key_match';
  title: string;
  body: string;
  cta: { text: string; url: string };
  priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class ReengagementService {
  private readonly logger = new Logger(ReengagementService.name);

  constructor(
    private readonly retention: RetentionEngineService,
    private readonly streakTracker: StreakTrackerService,
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Generate re-engagement nudges for at-risk users.
   */
  async generateNudges(): Promise<ReengagementNudge[]> {
    const nudges: ReengagementNudge[] = [];

    // 1. Streak risk users — loss aversion
    const atRiskStreaks = this.streakTracker.getAtRiskStreaks();
    for (const streak of atRiskStreaks.slice(0, 10)) {
      nudges.push({
        userId: streak.userId,
        type: 'streak_risk',
        title: `🔥 ${streak.currentStreak} 天连续记录即将中断！`,
        body: `你已经连续 ${streak.currentStreak} 天使用 AI Sports OS。今天打开，保持你的 streak！`,
        cta: { text: '保持连胜', url: '/' },
        priority: 'high',
      });
    }

    // 2. Churn risk users — event-driven
    const churnRisks = this.retention.getChurnRiskUsers(10);
    const todayMatches = await this.matchesService.findTodayMatches();

    for (const risk of churnRisks) {
      if (todayMatches.length > 0) {
        const topMatch = todayMatches[0];
        nudges.push({
          userId: risk.userId,
          type: 'key_match',
          title: `⚽ ${topMatch.home_team?.name} vs ${topMatch.away_team?.name} 今晚开打`,
          body: `你关注的比赛今晚 ${topMatch.kickoff_time?.substring(0, 5) || ''} 开始。AI 分析已就绪。`,
          cta: { text: '查看 AI 预测', url: `/matches/${topMatch.id}/analysis` },
          priority: risk.tier !== 'free' ? 'high' : 'medium',
        });
      } else {
        nudges.push({
          userId: risk.userId,
          type: 'new_content',
          title: '📊 你的 AI 分析周报已生成',
          body: '查看你关注的球队最新动态和 AI 洞察。',
          cta: { text: '查看周报', url: '/' },
          priority: 'medium',
        });
      }
    }

    return nudges;
  }

  /**
   * Generate one personalized nudge for a specific user.
   */
  async getPersonalNudge(userId: string, tier: string): Promise<ReengagementNudge | null> {
    const streak = this.streakTracker.getStreak(userId);

    // Streak at risk
    if (streak.currentStreak >= 3) {
      return {
        userId, type: 'streak_risk',
        title: `🔥 ${streak.currentStreak} 天连胜中`,
        body: '今天坚持使用，解锁下一枚徽章！',
        cta: { text: '继续连胜', url: '/' },
        priority: 'medium',
      };
    }

    // Pro user — show value
    if (tier === 'vip' || tier === 'pro') {
      return {
        userId, type: 'new_content',
        title: '📊 你的专属 AI 分析已更新',
        body: '今日比赛预测和战术分析已生成。',
        cta: { text: '查看分析', url: '/' },
        priority: 'low',
      };
    }

    return null;
  }

  // Daily re-engagement sweep
  @Cron('0 10 * * *') // 10 AM daily
  private async dailyReengagementSweep(): Promise<void> {
    const nudges = await this.generateNudges();
    this.logger.log(
      `[Reengagement] Generated ${nudges.length} nudges: ` +
      `streak=${nudges.filter(n => n.type === 'streak_risk').length} ` +
      `match=${nudges.filter(n => n.type === 'key_match').length} ` +
      `content=${nudges.filter(n => n.type === 'new_content').length}`,
    );
  }
}
