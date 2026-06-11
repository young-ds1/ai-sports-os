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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueController = void 0;
const common_1 = require("@nestjs/common");
const habit_loop_service_1 = require("./habit-loop.service");
const streak_tracker_service_1 = require("./streak-tracker.service");
const retention_engine_service_1 = require("./retention-engine.service");
const upgrade_path_service_1 = require("./upgrade-path.service");
const reengagement_service_1 = require("./reengagement.service");
const revenue_flywheel_service_1 = require("./revenue-flywheel.service");
const public_decorator_1 = require("../../shared/decorators/public.decorator");
let RevenueController = class RevenueController {
    habitLoop;
    streakTracker;
    retention;
    upgradePath;
    reengagement;
    flywheel;
    constructor(habitLoop, streakTracker, retention, upgradePath, reengagement, flywheel) {
        this.habitLoop = habitLoop;
        this.streakTracker = streakTracker;
        this.retention = retention;
        this.upgradePath = upgradePath;
        this.reengagement = reengagement;
        this.flywheel = flywheel;
    }
    // ── Daily Touchpoint ──
    async getDailyDigest(req) {
        const userId = req.user?.id;
        const digest = await this.habitLoop.getTodayDigest(userId);
        return { data: digest };
    }
    // ── Streak & Gamification ──
    async getStreak(req) {
        const userId = req.user?.id || 'anonymous';
        const streak = this.streakTracker.getStreak(userId);
        return { data: streak };
    }
    async getLeaderboard(limit = 10) {
        return { data: this.streakTracker.getLeaderboard(limit) };
    }
    async recordActivity(req, action) {
        const userId = req.user?.id || 'anonymous';
        const tier = req.user?.tier || 'free';
        this.streakTracker.recordActivity(userId);
        this.retention.recordSession(userId, tier, action);
        return { status: 'ok' };
    }
    // ── Retention ──
    async getRetentionOverview() {
        return { data: this.retention.getOverview() };
    }
    async getCohortRetention(date) {
        return { data: this.retention.getCohortRetention(date) };
    }
    async getChurnRisk(limit = 20) {
        return { data: this.retention.getChurnRiskUsers(limit) };
    }
    // ── Upgrade Path ──
    async getUpgradePath(req, analysisCount = 0, questions = 0, askedPrediction = 'false') {
        const userId = req.user?.id || 'anonymous';
        const tier = req.user?.tier || 'free';
        const streak = this.streakTracker.getStreak(userId);
        const path = this.upgradePath.evaluate(userId, {
            tier,
            todayAnalysisCount: +analysisCount,
            dailyLimit: 3,
            consecutiveQuestions: +questions,
            hasAskedPrediction: askedPrediction === 'true',
            hasViewedKeyMatch: false,
            streak: streak.currentStreak,
        });
        return { data: path };
    }
    // ── Reengagement ──
    async getNudges() {
        const nudges = await this.reengagement.generateNudges();
        return { data: nudges };
    }
    async getPersonalNudge(req) {
        const userId = req.user?.id || 'anonymous';
        const tier = req.user?.tier || 'free';
        const nudge = await this.reengagement.getPersonalNudge(userId, tier);
        return { data: nudge };
    }
    // ── Revenue Flywheel Dashboard ──
    async getFlywheelDashboard() {
        return { data: this.flywheel.getDashboard() };
    }
};
exports.RevenueController = RevenueController;
__decorate([
    (0, common_1.Get)('digest'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getDailyDigest", null);
__decorate([
    (0, common_1.Get)('streak'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getStreak", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Post)('activity'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "recordActivity", null);
__decorate([
    (0, common_1.Get)('retention/overview'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getRetentionOverview", null);
__decorate([
    (0, common_1.Get)('retention/cohort'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getCohortRetention", null);
__decorate([
    (0, common_1.Get)('retention/churn-risk'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getChurnRisk", null);
__decorate([
    (0, common_1.Get)('upgrade-path'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('analysisCount')),
    __param(2, (0, common_1.Query)('questions')),
    __param(3, (0, common_1.Query)('askedPrediction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getUpgradePath", null);
__decorate([
    (0, common_1.Get)('nudges'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getNudges", null);
__decorate([
    (0, common_1.Get)('nudge'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getPersonalNudge", null);
__decorate([
    (0, common_1.Get)('flywheel'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getFlywheelDashboard", null);
exports.RevenueController = RevenueController = __decorate([
    (0, common_1.Controller)('api/revenue'),
    __metadata("design:paramtypes", [habit_loop_service_1.HabitLoopService,
        streak_tracker_service_1.StreakTrackerService,
        retention_engine_service_1.RetentionEngineService,
        upgrade_path_service_1.UpgradePathService,
        reengagement_service_1.ReengagementService,
        revenue_flywheel_service_1.RevenueFlywheelService])
], RevenueController);
//# sourceMappingURL=revenue.controller.js.map