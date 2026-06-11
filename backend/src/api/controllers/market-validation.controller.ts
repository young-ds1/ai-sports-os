import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { MarketValidationService } from '../../../../modules/users/market-validation.service';
import { GrowthDashboardService } from '../../../../modules/users/growth-dashboard.service';
import { TrafficEngineService } from '../../../../modules/users/traffic-engine.service';
import { UserQualityService } from '../../../../modules/users/user-quality.service';
import { ICPValidationService } from '../../../../modules/users/icp-validation.service';
import { FlywheelDesignService } from '../../../../modules/users/flywheel-design.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/admin')
export class MarketValidationController {
  constructor(
    private readonly mv: MarketValidationService,
    private readonly growth: GrowthDashboardService,
    private readonly traffic: TrafficEngineService,
    private readonly quality: UserQualityService,
    private readonly icp: ICPValidationService,
    private readonly flywheel: FlywheelDesignService,
  ) {}

  @Get('funnel')
  @Public()
  async getFunnel(@Query('days') days = 7) {
    const report = await this.mv.getFunnel(days);
    const visitors = report.totalVisitors;
    report.stages.forEach(s => {
      s.overallRate = visitors > 0 ? Math.round((s.count / visitors) * 10000) / 100 : 0;
    });
    return report; // TransformInterceptor wraps in {data, meta}
  }

  @Get('retention')
  @Public()
  async getRetention(@Query('cohort') cohort?: string) {
    return await this.mv.getRetention(cohort);
  }

  @Get('payment-funnel')
  @Public()
  async getPaymentFunnel() {
    return this.mv.getPaymentFunnel();
  }

  @Post('payment-event')
  @Public()
  async trackPaymentEvent(@Body() body: { userId: string; event: string; amount?: number }) {
    this.mv.trackPaymentEvent(body.userId, body.event, body.amount);
    return { status: 'ok' };
  }

  @Get('attribution')
  @Public()
  async getAttribution(@Query('days') days = 7) {
    return await this.mv.getContentAttribution(days);
  }

  @Get('north-star-status')
  @Public()
  async getNorthStarStatus() {
    return await this.mv.getNorthStarStatus();
  }

  @Get('weekly-report')
  @Public()
  async getWeeklyReport() {
    return await this.mv.getWeeklyReport();
  }

  // ── PHASE X-A: Growth Dashboard ──

  @Get('growth/acquisition')
  @Public()
  async getAcquisition(@Query('days') days = 7) {
    return await this.growth.getAcquisitionSnapshot(days);
  }

  @Post('growth/track-visitor')
  @Public()
  async trackVisitor(@Body() body: {
    source: string; campaign?: string; contentType?: string;
    signedUp?: boolean; didAiAction?: boolean; didPay?: boolean;
  }) {
    this.growth.trackVisitor(body);
    return { status: 'ok' };
  }

  @Get('growth/content-plan')
  @Public()
  async getContentPlan() {
    return this.growth.getDailyContentPlan();
  }

  @Get('growth/content')
  @Public()
  async getMatchContent(@Query('matchId') matchId: string) {
    return this.growth.getContentForMatch(matchId);
  }

  @Get('growth/success-metrics')
  @Public()
  async getSuccessMetrics() {
    return await this.growth.getSuccessMetrics();
  }

  // ── PHASE Y: Traffic Engine ──

  @Get('traffic/dashboard')
  @Public()
  async getTrafficDashboard() {
    return await this.traffic.getAcquisitionDashboard();
  }

  @Post('traffic/track-visit')
  @Public()
  async trackChannelVisit(@Body() body: {
    channel: string; campaign: string; contentId: string;
    contentExperiment: string; registered?: boolean;
    clickedAiAnalysis?: boolean; usedAiChat?: boolean;
    sawPaywall?: boolean; paid?: boolean;
  }) {
    this.traffic.trackChannelVisit(body);
    return { status: 'ok' };
  }

  @Get('traffic/content-experiments')
  @Public()
  async getContentExperiments() {
    return this.traffic.getContentPerformance();
  }

  @Post('traffic/share')
  @Public()
  async trackShare(@Body() body: { userId: string; platform: string }) {
    this.traffic.trackShare(body.userId, body.platform);
    return { status: 'ok' };
  }

  @Get('traffic/virality')
  @Public()
  async getVirality() {
    return this.traffic.getViralityMetrics();
  }

  @Get('traffic/scorecard')
  @Public()
  async getScorecard() {
    return await this.traffic.getChannelScorecard();
  }

  @Get('traffic/kill-list')
  @Public()
  async getKillList() {
    return this.traffic.getKillList();
  }

  @Get('traffic/scale-list')
  @Public()
  async getScaleList() {
    return this.traffic.getScaleList();
  }

  @Get('traffic/auto-decisions')
  @Public()
  async getAutoDecisions() {
    return this.traffic.getAutoDecisions();
  }

  @Get('traffic/weekly-report')
  @Public()
  async getTrafficWeeklyReport() {
    return await this.traffic.getWeeklyTrafficReport();
  }

  // ── PHASE Z: User Quality Validation ──

  @Post('quality/track')
  @Public()
  async trackQualityAction(@Body() body: {
    userId: string; channel: string; contentExperiment: string;
    action: string; invitedBy?: string;
  }) {
    this.quality.trackUserAction(body);
    return { status: 'ok' };
  }

  @Get('quality/distribution')
  @Public()
  async getQualityDistribution() {
    return this.quality.getUserQualityDistribution();
  }

  @Get('quality/channels')
  @Public()
  async getChannelQuality() {
    return this.quality.getChannelQualityReport();
  }

  @Get('quality/content')
  @Public()
  async getContentQuality() {
    return this.quality.getContentQualityReport();
  }

  @Get('quality/share-loop')
  @Public()
  async getShareLoop() {
    return this.quality.getShareLoopAnalysis();
  }

  @Get('quality/decisions')
  @Public()
  async getQualityDecisions() {
    return this.quality.getQualityBasedDecisions();
  }

  @Get('quality/weekly-report')
  @Public()
  async getQualityWeeklyReport() {
    return this.quality.getWeeklyQualityReport();
  }

  // ── PHASE AA: ICP Validation ──

  @Post('icp/segment')
  @Public()
  async segmentUser(@Body() body: { userId: string; segment: string }) {
    this.icp.segmentUser(body.userId, body.segment as any);
    return { status: 'ok' };
  }

  @Post('icp/track')
  @Public()
  async trackICPAction(@Body() body: {
    userId: string; channel?: string; contentExperiment?: string;
    action: string; amount?: number;
  }) {
    this.icp.trackAction(body.userId, body);
    return { status: 'ok' };
  }

  @Get('icp/segments')
  @Public()
  async getSegments() {
    return this.icp.getSegmentProfiles();
  }

  @Get('icp/best-fit')
  @Public()
  async getBestFit() {
    return this.icp.getBestFitPerSegment();
  }

  @Get('icp/weekly-report')
  @Public()
  async getICPWeeklyReport() {
    return this.icp.getICPWeeklyReport();
  }

  // ── PHASE AB: Flywheel Hypothesis Design ──
  // THIS IS NOT A MEASUREMENT ENDPOINT.
  // All values are hypothesis-only until validation gates are met.

  @Get('flywheel/hypothesis')
  @Public()
  async getFlywheelHypothesis() {
    return this.flywheel.getHypothesisDocument();
  }
}
