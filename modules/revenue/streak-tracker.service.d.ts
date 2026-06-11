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
export declare class StreakTrackerService {
    private readonly logger;
    private streaks;
    /**
     * Record daily activity for a user. Call on any AI action or page view.
     */
    recordActivity(userId: string): UserStreak;
    /**
     * Get streak status for display in the app header.
     */
    getStreak(userId: string): UserStreak;
    /**
     * Get the "at-risk" users — streak ≥ 5 days and inactive today.
     * These users are most likely to feel loss aversion if reminded.
     */
    getAtRiskStreaks(): UserStreak[];
    /**
     * Get leaderboard — top users by points.
     */
    getLeaderboard(limit?: number): UserStreak[];
    private getDateOffset;
    private resetBrokenStreaks;
}
//# sourceMappingURL=streak-tracker.service.d.ts.map