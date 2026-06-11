import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MatchesService } from '../domain/matches/matches.service';
import { OpenaiService } from '../ai-engine/engines/openai.service';
import { CostTrackerService } from '../ai-engine/cost/cost-tracker.service';
import { StreakTrackerService } from './streak-tracker.service';

/**
 * HabitLoopService — creates daily AI touchpoints so users build a habit.
 *
 * Three daily touchpoints:
 * 1. "Today's Picks" — AI-selected must-watch matches
 * 2. "Team Pulse" — one-sentence status update on followed teams
 * 3. "Daily Insight" — one surprising stat or trend
 *
 * Goal: User opens the app even when there's no live match.
 */

export interface DailyDigest {
  date: string;
  todaysPicks: Array<{
    matchId: string;
    headline: string;
    reason: string;
    kickoffTime: string;
  }>;
  teamPulse: Array<{
    teamName: string;
    status: string;
    nextMatch: string;
  }>;
  dailyInsight: string;
  userStreak?: {
    current: number;
    badge: string | null;
    message: string;
  };
}

@Injectable()
export class HabitLoopService {
  private readonly logger = new Logger(HabitLoopService.name);
  private todayDigest: DailyDigest | null = null;

  constructor(
    private readonly matchesService: MatchesService,
    private readonly openai: OpenaiService,
    private readonly costTracker: CostTrackerService,
    private readonly streakTracker: StreakTrackerService,
  ) {}

  /**
   * Generate today's digest. Cached for the day.
   */
  async getTodayDigest(userId?: string): Promise<DailyDigest> {
    const today = new Date().toISOString().split('T')[0];

    if (this.todayDigest?.date === today) {
      // Append user-specific streak data
      if (userId) {
        const streak = this.streakTracker.getStreak(userId);
        return {
          ...this.todayDigest,
          userStreak: this.buildStreakMessage(streak),
        };
      }
      return this.todayDigest;
    }

    // Generate new digest
    const todayMatches = await this.matchesService.findByDate(today);
    const tomorrowMatches = await this.matchesService.findByDate(
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
    );
    const allUpcoming = [...todayMatches, ...tomorrowMatches].slice(0, 8);

    // AI picks the top 3 must-watch matches
    const picksPrompt = allUpcoming.map(m =>
      `${m.home_team?.name || '?'} vs ${m.away_team?.name || '?'} at ${m.kickoff_time || 'TBD'} — ${m.competition?.name || ''} ${m.group_name ? `Group ${m.group_name}` : ''}`
    ).join('\n');

    const cost = this.costTracker.estimateCall({ tier: 'vip', model: 'gpt-4o-mini', estimatedInputTokens: 500, estimatedOutputTokens: 400 });

    let todaysPicks: DailyDigest['todaysPicks'] = [];
    let dailyInsight = '';

    try {
      const result = await this.openai.chat([
        { role: 'system', content: 'You are a sports editor. Pick the 3 most exciting matches from this list. For each: headline (max 15 chars), reason (one sentence why watch). Also generate ONE surprising daily insight (one sentence). Output in Chinese. Format: JSON array.' },
        { role: 'user', content: picksPrompt },
      ], { temperature: 0.7, maxTokens: 400 });

      // Parse AI response — simplified
      const lines = result.answer.split('\n').filter(l => l.trim());
      dailyInsight = lines[lines.length - 1] || '今日世界杯战火继续，多场焦点对决不容错过。';

      todaysPicks = allUpcoming.slice(0, 3).map(m => ({
        matchId: m.id,
        headline: `${m.home_team?.name || '?'} vs ${m.away_team?.name || '?'}`,
        reason: `${m.competition?.name || '世界杯'} · ${m.group_name ? `Group ${m.group_name}` : ''}`,
        kickoffTime: m.kickoff_time?.substring(0, 5) || 'TBD',
      }));

      this.costTracker.recordCall({
        user_id: 'system', action: 'daily_digest', model: result.model,
        input_tokens: 500, output_tokens: result.tokensUsed || 400,
        estimated_cost_usd: cost.estimatedCost, tier: 'vip',
      });
    } catch {
      todaysPicks = allUpcoming.slice(0, 3).map(m => ({
        matchId: m.id,
        headline: `${m.home_team?.name || '?'} vs ${m.away_team?.name || '?'}`,
        reason: '今日焦点对决',
        kickoffTime: m.kickoff_time?.substring(0, 5) || 'TBD',
      }));
      dailyInsight = '今日世界杯比赛继续，多场精彩对决等待你的关注。';
    }

    // Team pulse — from matches
    const teamPulse = allUpcoming.slice(0, 5).map(m => ({
      teamName: m.home_team?.name || '?',
      status: m.status === 'live' ? '🔴 比赛中' : '📅 即将出战',
      nextMatch: `${m.away_team?.name || '?'} @ ${m.kickoff_time?.substring(0, 5) || 'TBD'}`,
    }));

    this.todayDigest = {
      date: today,
      todaysPicks,
      teamPulse,
      dailyInsight,
    };

    if (userId) {
      this.todayDigest.userStreak = this.buildStreakMessage(
        this.streakTracker.getStreak(userId),
      );
    }

    this.logger.log(`[HabitLoop] Daily digest generated: ${todaysPicks.length} picks, ${teamPulse.length} team pulses`);
    return this.todayDigest;
  }

  private buildStreakMessage(streak: ReturnType<StreakTrackerService['getStreak']>) {
    if (streak.currentStreak === 0) {
      return { current: 0, badge: null, message: '👋 欢迎回来！开始你的 AI 体育之旅' };
    }
    if (streak.currentStreak >= 30) {
      return { current: streak.currentStreak, badge: '👑 AI Sports Expert', message: `🔥 ${streak.currentStreak} 天连续使用！你是顶级 AI 体育专家` };
    }
    if (streak.currentStreak >= 7) {
      return { current: streak.currentStreak, badge: '⚡ Power User', message: `⚡ ${streak.currentStreak} 天连续！保持这个节奏` };
    }
    if (streak.currentStreak >= 3) {
      return { current: streak.currentStreak, badge: '🔥 3-Day Streak', message: `🔥 ${streak.currentStreak} 天连续使用中` };
    }
    return { current: streak.currentStreak, badge: null, message: `坚持 ${streak.currentStreak} 天了，明天继续！` };
  }
}
