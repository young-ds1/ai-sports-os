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
var ReengagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReengagementService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const retention_engine_service_1 = require("./retention-engine.service");
const streak_tracker_service_1 = require("./streak-tracker.service");
const matches_service_1 = require("../domain/matches/matches.service");
let ReengagementService = ReengagementService_1 = class ReengagementService {
    retention;
    streakTracker;
    matchesService;
    logger = new common_1.Logger(ReengagementService_1.name);
    constructor(retention, streakTracker, matchesService) {
        this.retention = retention;
        this.streakTracker = streakTracker;
        this.matchesService = matchesService;
    }
    /**
     * Generate re-engagement nudges for at-risk users.
     */
    async generateNudges() {
        const nudges = [];
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
            }
            else {
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
    async getPersonalNudge(userId, tier) {
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
    async dailyReengagementSweep() {
        const nudges = await this.generateNudges();
        this.logger.log(`[Reengagement] Generated ${nudges.length} nudges: ` +
            `streak=${nudges.filter(n => n.type === 'streak_risk').length} ` +
            `match=${nudges.filter(n => n.type === 'key_match').length} ` +
            `content=${nudges.filter(n => n.type === 'new_content').length}`);
    }
};
exports.ReengagementService = ReengagementService;
__decorate([
    (0, schedule_1.Cron)('0 10 * * *') // 10 AM daily
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReengagementService.prototype, "dailyReengagementSweep", null);
exports.ReengagementService = ReengagementService = ReengagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [retention_engine_service_1.RetentionEngineService,
        streak_tracker_service_1.StreakTrackerService,
        matches_service_1.MatchesService])
], ReengagementService);
//# sourceMappingURL=reengagement.service.js.map