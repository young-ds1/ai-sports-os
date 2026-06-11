import { Controller, Get, Post, Query, Req } from '@nestjs/common';
import { HabitLoopService } from './habit-loop.service';
import { StreakTrackerService } from './streak-tracker.service';
import { RetentionEngineService } from './retention-engine.service';
import { UpgradePathService } from './upgrade-path.service';
import { ReengagementService } from './reengagement.service';
import { RevenueFlywheelService } from './revenue-flywheel.service';
import { Public } from '../../shared/decorators/public.decorator';

@Controller('api/revenue')
export class RevenueController {
  constructor(
    private readonly habitLoop: HabitLoopService,
    private readonly streakTracker: StreakTrackerService,
    private readonly retention: RetentionEngineService,
    private readonly upgradePath: UpgradePathService,
    private readonly reengagement: ReengagementService,
    private readonly flywheel: RevenueFlywheelService,
  ) {}

  // ── Daily Touchpoint ──

  @Get('digest')
  @Public()
  async getDailyDigest(@Req() req: any) {
    const userId = req.user?.id;
    const digest = await this.habitLoop.getTodayDigest(userId);
    return { data: digest };
  }

  // ── Streak & Gamification ──

  @Get('streak')
  @Public()
  async getStreak(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const streak = this.streakTracker.getStreak(userId);
    return { data: streak };
  }

  @Get('leaderboard')
  @Public()
  async getLeaderboard(@Query('limit') limit = 10) {
    return { data: this.streakTracker.getLeaderboard(limit) };
  }

  @Post('activity')
  @Public()
  async recordActivity(@Req() req: any, @Query('action') action?: string) {
    const userId = req.user?.id || 'anonymous';
    const tier = req.user?.tier || 'free';
    this.streakTracker.recordActivity(userId);
    this.retention.recordSession(userId, tier, action);
    return { status: 'ok' };
  }

  // ── Retention ──

  @Get('retention/overview')
  @Public()
  async getRetentionOverview() {
    return { data: this.retention.getOverview() };
  }

  @Get('retention/cohort')
  @Public()
  async getCohortRetention(@Query('date') date?: string) {
    return { data: this.retention.getCohortRetention(date) };
  }

  @Get('retention/churn-risk')
  @Public()
  async getChurnRisk(@Query('limit') limit = 20) {
    return { data: this.retention.getChurnRiskUsers(limit) };
  }

  // ── Upgrade Path ──

  @Get('upgrade-path')
  @Public()
  async getUpgradePath(@Req() req: any, @Query('analysisCount') analysisCount = 0, @Query('questions') questions = 0, @Query('askedPrediction') askedPrediction = 'false') {
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

  @Get('nudges')
  @Public()
  async getNudges() {
    const nudges = await this.reengagement.generateNudges();
    return { data: nudges };
  }

  @Get('nudge')
  @Public()
  async getPersonalNudge(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const tier = req.user?.tier || 'free';
    const nudge = await this.reengagement.getPersonalNudge(userId, tier);
    return { data: nudge };
  }

  // ── Revenue Flywheel Dashboard ──

  @Get('flywheel')
  @Public()
  async getFlywheelDashboard() {
    return { data: this.flywheel.getDashboard() };
  }
}
