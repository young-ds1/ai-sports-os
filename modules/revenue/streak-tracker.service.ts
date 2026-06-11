import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * StreakTracker — gamifies daily AI usage.
 *
 * Mechanics:
 * - Visit + AI action in a day = 1 streak day
 * - 3-day streak → badge unlock
 * - 7-day streak → "Power User" status
 * - 30-day streak → "AI Sports Expert" badge
 * - Streak break → reset (but total lifetime points preserved)
 *
 * Psychological hooks:
 * - Loss aversion: users don't want to break their streak
 * - Progress: visible count makes usage tangible
 * - Status: badges signal expertise to other users
 */

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string | null;
  badges: string[];
  points: number;
  tier: 'rookie' | 'regular' | 'power_user' | 'expert';
}

const STREAK_BADGES = [
  { days: 1, badge: '🟢 First Touch', points: 10 },
  { days: 3, badge: '🔥 3-Day Streak', points: 30 },
  { days: 7, badge: '⚡ Power User', points: 100 },
  { days: 14, badge: '💎 Dedicated Fan', points: 250 },
  { days: 30, badge: '👑 AI Sports Expert', points: 1000 },
];

@Injectable()
export class StreakTrackerService {
  private readonly logger = new Logger(StreakTrackerService.name);
  private streaks = new Map<string, UserStreak>();

  /**
   * Record daily activity for a user. Call on any AI action or page view.
   */
  recordActivity(userId: string): UserStreak {
    const today = new Date().toISOString().split('T')[0];
    let streak = this.streaks.get(userId);

    if (!streak) {
      streak = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
        badges: [],
        points: 0,
        tier: 'rookie',
      };
    }

    // Already active today — no change
    if (streak.lastActiveDate === today) return streak;

    const yesterday = this.getDateOffset(-1);
    const isConsecutive = streak.lastActiveDate === yesterday;

    if (isConsecutive) {
      streak.currentStreak++;
    } else if (streak.lastActiveDate !== today) {
      streak.currentStreak = 1; // Reset streak
    }

    streak.lastActiveDate = today;
    streak.totalActiveDays++;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    // Check badge unlocks
    for (const { days, badge, points } of STREAK_BADGES) {
      if (streak.currentStreak >= days && !streak.badges.includes(badge)) {
        streak.badges.push(badge);
        streak.points += points;
        this.logger.log(`[Streak] 🏅 ${badge} unlocked! user=${userId.substring(0, 8)} streak=${streak.currentStreak}`);
      }
    }

    // Update tier
    if (streak.currentStreak >= 30) streak.tier = 'expert';
    else if (streak.currentStreak >= 7) streak.tier = 'power_user';
    else if (streak.currentStreak >= 3) streak.tier = 'regular';
    else streak.tier = 'rookie';

    this.streaks.set(userId, streak);
    return streak;
  }

  /**
   * Get streak status for display in the app header.
   */
  getStreak(userId: string): UserStreak {
    return this.streaks.get(userId) || {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
      badges: [],
      points: 0,
      tier: 'rookie',
    };
  }

  /**
   * Get the "at-risk" users — streak ≥ 5 days and inactive today.
   * These users are most likely to feel loss aversion if reminded.
   */
  getAtRiskStreaks(): UserStreak[] {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.streaks.values())
      .filter(s => s.currentStreak >= 5 && s.lastActiveDate !== today)
      .sort((a, b) => b.currentStreak - a.currentStreak);
  }

  /**
   * Get leaderboard — top users by points.
   */
  getLeaderboard(limit = 10): UserStreak[] {
    return Array.from(this.streaks.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  private getDateOffset(offset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }

  // Reset streak for users who missed yesterday (runs daily)
  @Cron('0 1 * * *') // 1 AM daily
  private resetBrokenStreaks(): void {
    const yesterday = this.getDateOffset(-1);
    let resets = 0;
    for (const [userId, streak] of this.streaks) {
      if (streak.lastActiveDate && streak.lastActiveDate < yesterday) {
        streak.currentStreak = 0;
        resets++;
      }
    }
    if (resets > 0) this.logger.log(`[Streak] Reset ${resets} broken streaks`);
  }
}
