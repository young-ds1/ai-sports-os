"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StreakTrackerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakTrackerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const STREAK_BADGES = [
    { days: 1, badge: '🟢 First Touch', points: 10 },
    { days: 3, badge: '🔥 3-Day Streak', points: 30 },
    { days: 7, badge: '⚡ Power User', points: 100 },
    { days: 14, badge: '💎 Dedicated Fan', points: 250 },
    { days: 30, badge: '👑 AI Sports Expert', points: 1000 },
];
let StreakTrackerService = StreakTrackerService_1 = class StreakTrackerService {
    logger = new common_1.Logger(StreakTrackerService_1.name);
    streaks = new Map();
    /**
     * Record daily activity for a user. Call on any AI action or page view.
     */
    recordActivity(userId) {
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
        if (streak.lastActiveDate === today)
            return streak;
        const yesterday = this.getDateOffset(-1);
        const isConsecutive = streak.lastActiveDate === yesterday;
        if (isConsecutive) {
            streak.currentStreak++;
        }
        else if (streak.lastActiveDate !== today) {
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
        if (streak.currentStreak >= 30)
            streak.tier = 'expert';
        else if (streak.currentStreak >= 7)
            streak.tier = 'power_user';
        else if (streak.currentStreak >= 3)
            streak.tier = 'regular';
        else
            streak.tier = 'rookie';
        this.streaks.set(userId, streak);
        return streak;
    }
    /**
     * Get streak status for display in the app header.
     */
    getStreak(userId) {
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
    getAtRiskStreaks() {
        const today = new Date().toISOString().split('T')[0];
        return Array.from(this.streaks.values())
            .filter(s => s.currentStreak >= 5 && s.lastActiveDate !== today)
            .sort((a, b) => b.currentStreak - a.currentStreak);
    }
    /**
     * Get leaderboard — top users by points.
     */
    getLeaderboard(limit = 10) {
        return Array.from(this.streaks.values())
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }
    getDateOffset(offset) {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
    }
    // Reset streak for users who missed yesterday (runs daily)
    resetBrokenStreaks() {
        const yesterday = this.getDateOffset(-1);
        let resets = 0;
        for (const [userId, streak] of this.streaks) {
            if (streak.lastActiveDate && streak.lastActiveDate < yesterday) {
                streak.currentStreak = 0;
                resets++;
            }
        }
        if (resets > 0)
            this.logger.log(`[Streak] Reset ${resets} broken streaks`);
    }
};
exports.StreakTrackerService = StreakTrackerService;
__decorate([
    (0, schedule_1.Cron)('0 1 * * *') // 1 AM daily
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StreakTrackerService.prototype, "resetBrokenStreaks", null);
exports.StreakTrackerService = StreakTrackerService = StreakTrackerService_1 = __decorate([
    (0, common_1.Injectable)()
], StreakTrackerService);
//# sourceMappingURL=streak-tracker.service.js.map