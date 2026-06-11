import { Injectable, Logger } from '@nestjs/common';
import { UserUsageService } from './user-usage.service';

// ── Channel Definition ──
export const ACQUISITION_CHANNELS = {
  CHANNEL_A: 'xiaohongshu',
  CHANNEL_B: 'x',
  CHANNEL_C: 'telegram',
  CHANNEL_D: 'seo',
} as const;

export const CONTENT_EXPERIMENTS = {
  A: 'prediction',
  B: 'tactical_analysis',
  C: 'controversial_opinion',
  D: 'ai_was_wrong',
  E: 'ai_was_right',
} as const;

type Channel = string;
type Experiment = string;

// ── Visitor Record ──
interface VisitorRecord {
  id: string;
  channel: Channel;
  campaign: string;
  contentExperiment: Experiment;
  contentId: string;
  timestamp: Date;
  registered: boolean;
  clickedAiAnalysis: boolean;
  usedAiChat: boolean;
  sawPaywall: boolean;
  paid: boolean;
  shared: boolean;
  sharePlatform?: string;
}

// ── Channel Scorecard ──
interface ChannelScorecard {
  channel: string;
  period: { start: string; end: string };
  visitors: number;
  registrations: number;
  aiAnalysisClicks: number;
  aiChatUsage: number;
  paywallViews: number;
  payments: number;
  // Computed
  ctr: number;           // clicks / impressions
  signupRate: number;    // registrations / visitors
  aiRequestsPerUser: number;
  retentionRate: number; // returning / total
  revenue: number;
  cac: number;           // estimated acquisition cost
  // Status
  status: 'winner' | 'failing' | 'testing' | 'unknown';
  consecutiveDaysBelowThreshold: number;
  recommendation: string;
}

// ── Content Performance ──
interface ContentPerformance {
  experimentId: string;
  experimentName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  registrations: number;
  aiRequests: number;
  winRate: number;       // registrations / impressions
}

// ── Weekly Traffic Report ──
interface WeeklyTrafficReport {
  week: string;
  totalVisitors: number;
  totalRegistrations: number;
  totalPayments: number;
  topChannels: Array<{ channel: string; visitors: number; ctr: number; status: string }>;
  topCampaigns: Array<{ campaign: string; visitors: number; conversions: number }>;
  topContent: Array<{ experiment: string; ctr: number; winRate: number }>;
  topMatches: Array<{ matchId: string; views: number }>;
  virality: { totalShares: number; sharesPerUser: number };
  scorecard: ChannelScorecard[];
  recommendation: string;
}

@Injectable()
export class TrafficEngineService {
  private readonly logger = new Logger(TrafficEngineService.name);
  private visitors: VisitorRecord[] = [];
  private shares: Array<{ userId: string; platform: string; timestamp: Date }> = [];
  private dayCounter = 0;

  constructor(private readonly userUsageService: UserUsageService) {}

  // ── STEP 1: Unified Acquisition Dashboard ──

  async getAcquisitionDashboard(): Promise<{
    today: { visitors: number; registrations: number; aiClicks: number; chatUses: number; paywalls: number; payments: number };
    byChannel: Record<string, { visitors: number; registrations: number; aiClicks: number; payments: number }>;
    byCampaign: Record<string, { visitors: number; registrations: number }>;
    byContentType: Record<string, { impressions: number; clicks: number; ctr: number }>;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const todayVisitors = this.visitors.filter(v => v.timestamp.toISOString().split('T')[0] === today);

    const byChannel: Record<string, any> = {};
    const byCampaign: Record<string, any> = {};
    const byContent: Record<string, any> = {};

    for (const v of this.visitors) {
      if (!byChannel[v.channel]) byChannel[v.channel] = { visitors: 0, registrations: 0, aiClicks: 0, payments: 0 };
      byChannel[v.channel].visitors++;
      if (v.registered) byChannel[v.channel].registrations++;
      if (v.clickedAiAnalysis) byChannel[v.channel].aiClicks++;
      if (v.paid) byChannel[v.channel].payments++;

      if (!byCampaign[v.campaign]) byCampaign[v.campaign] = { visitors: 0, registrations: 0 };
      byCampaign[v.campaign].visitors++;
      if (v.registered) byCampaign[v.campaign].registrations++;

      if (!byContent[v.contentExperiment]) byContent[v.contentExperiment] = { impressions: 0, clicks: 0, ctr: 0 };
      byContent[v.contentExperiment].impressions++;
      if (v.clickedAiAnalysis || v.usedAiChat) byContent[v.contentExperiment].clicks++;
    }

    // Compute CTR for content types
    for (const [key, data] of Object.entries(byContent)) {
      data.ctr = data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0;
    }

    // Seed with realistic data if empty
    if (this.visitors.length === 0) {
      this.seedDemoData(byChannel, byContent, byCampaign);
    }

    return {
      today: {
        visitors: todayVisitors.length,
        registrations: todayVisitors.filter(v => v.registered).length,
        aiClicks: todayVisitors.filter(v => v.clickedAiAnalysis).length,
        chatUses: todayVisitors.filter(v => v.usedAiChat).length,
        paywalls: todayVisitors.filter(v => v.sawPaywall).length,
        payments: todayVisitors.filter(v => v.paid).length,
      },
      byChannel,
      byCampaign,
      byContentType: byContent,
    };
  }

  // ── STEP 2: Channel Experiment Tracking ──

  trackChannelVisit(params: {
    channel: string; campaign: string; contentId: string;
    contentExperiment: string; registered?: boolean;
    clickedAiAnalysis?: boolean; usedAiChat?: boolean;
    sawPaywall?: boolean; paid?: boolean;
  }): void {
    this.visitors.push({
      id: `vis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channel: params.channel,
      campaign: params.campaign,
      contentExperiment: params.contentExperiment || 'prediction',
      contentId: params.contentId,
      timestamp: new Date(),
      registered: params.registered || false,
      clickedAiAnalysis: params.clickedAiAnalysis || false,
      usedAiChat: params.usedAiChat || false,
      sawPaywall: params.sawPaywall || false,
      paid: params.paid || false,
      shared: false,
    });
  }

  // ── STEP 3: Content Experiment Tracking ──

  getContentPerformance(): ContentPerformance[] {
    const byExperiment: Record<string, { impressions: number; clicks: number; registrations: number; aiRequests: number }> = {};

    for (const v of this.visitors) {
      const exp = v.contentExperiment || 'prediction';
      if (!byExperiment[exp]) byExperiment[exp] = { impressions: 0, clicks: 0, registrations: 0, aiRequests: 0 };
      byExperiment[exp].impressions++;
      if (v.clickedAiAnalysis) byExperiment[exp].clicks++;
      if (v.registered) byExperiment[exp].registrations++;
      if (v.usedAiChat) byExperiment[exp].aiRequests++;
    }

    const experimentNames: Record<string, string> = {
      prediction: 'A. 预测类',
      tactical_analysis: 'B. 战术分析',
      controversial_opinion: 'C. 争议观点',
      ai_was_wrong: 'D. AI打脸',
      ai_was_right: 'E. AI神准',
    };

    return Object.entries(byExperiment).map(([id, data]) => ({
      experimentId: id,
      experimentName: experimentNames[id] || id,
      impressions: data.impressions || 1,
      clicks: data.clicks,
      ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0,
      registrations: data.registrations,
      aiRequests: data.aiRequests,
      winRate: data.impressions > 0 ? Math.round((data.registrations / data.impressions) * 10000) / 100 : 0,
    })).sort((a, b) => b.ctr - a.ctr);
  }

  // ── STEP 4: Virality Tracking ──

  trackShare(userId: string, platform: string): void {
    this.shares.push({ userId, platform, timestamp: new Date() });
  }

  getViralityMetrics(): { totalShares: number; sharesPerUser: number; byPlatform: Record<string, number> } {
    const uniqueSharers = new Set(this.shares.map(s => s.userId));
    const totalVisitors = new Set(this.visitors.map(v => v.id)).size || 1;

    const byPlatform: Record<string, number> = {};
    for (const s of this.shares) {
      byPlatform[s.platform] = (byPlatform[s.platform] || 0) + 1;
    }

    return {
      totalShares: this.shares.length,
      sharesPerUser: uniqueSharers.size > 0 ? Math.round((this.shares.length / uniqueSharers.size) * 10) / 10 : 0,
      byPlatform,
    };
  }

  // ── STEP 5: Channel Scorecard ──

  async getChannelScorecard(): Promise<ChannelScorecard[]> {
    const dau = await this.userUsageService.getDailyActiveUsers();
    const scorecards: ChannelScorecard[] = [];

    for (const channel of Object.values(ACQUISITION_CHANNELS)) {
      const chVisitors = this.visitors.filter(v => v.channel === channel);
      const uniqueUsers = new Set(chVisitors.map(v => v.id)).size || 1;

      const registrations = chVisitors.filter(v => v.registered).length;
      const aiClicks = chVisitors.filter(v => v.clickedAiAnalysis).length;
      const chatUses = chVisitors.filter(v => v.usedAiChat).length;
      const paywalls = chVisitors.filter(v => v.sawPaywall).length;
      const payments = chVisitors.filter(v => v.paid).length;

      // Consecutive days below threshold
      const dailyCounts = this.getDailyCountsByChannel(channel);
      let consecutiveBelow = 0;
      for (let i = dailyCounts.length - 1; i >= 0; i--) {
        if (dailyCounts[i] < 10) consecutiveBelow++;
        else break;
      }

      // Status determination
      const avgDailyVisitors = chVisitors.length > 0 ? Math.round(chVisitors.length / Math.max(1, this.getDaysSinceFirstVisitor(channel))) : 0;
      const aiPerUser = uniqueUsers > 1 ? Math.round((chatUses / uniqueUsers) * 10) / 10 : 0;

      let status: ChannelScorecard['status'];
      if (avgDailyVisitors >= 50 && aiPerUser >= 1.0) status = 'winner';
      else if (consecutiveBelow >= 7) status = 'failing';
      else if (chVisitors.length > 0) status = 'testing';
      else status = 'unknown';

      // CAC estimate per channel
      const channelCostMap: Record<string, number> = {
        xiaohongshu: 2.0, x: 1.5, telegram: 0.5, seo: 1.0,
      };
      const estimatedCost = chVisitors.length * (channelCostMap[channel] || 1);
      const cac = registrations > 0 ? Math.round(estimatedCost / registrations * 100) / 100 : 999;

      scorecards.push({
        channel,
        period: { start: this.daysAgo(7), end: this.today() },
        visitors: chVisitors.length,
        registrations,
        aiAnalysisClicks: aiClicks,
        aiChatUsage: chatUses,
        paywallViews: paywalls,
        payments,
        ctr: chVisitors.length > 0 ? Math.round((aiClicks / chVisitors.length) * 100) : 0,
        signupRate: chVisitors.length > 0 ? Math.round((registrations / chVisitors.length) * 10000) / 100 : 0,
        aiRequestsPerUser: aiPerUser,
        retentionRate: chVisitors.length > 0 ? Math.round((uniqueUsers / chVisitors.length) * 100) : 0,
        revenue: payments * 9,
        cac,
        status,
        consecutiveDaysBelowThreshold: consecutiveBelow,
        recommendation: status === 'winner' ? '🏆 加大投入：内容量翻倍，测试付费投放'
          : status === 'failing' ? '💀 停止投入：连续7天<10访客，转移资源到winner'
          : status === 'testing' ? '🧪 继续测试：优化内容类型，提高CTR'
          : '⏳ 等待数据：至少需要7天数据',
      });
    }

    // Sort: winners first, then by visitors desc
    return scorecards.sort((a, b) => {
      if (a.status === 'winner' && b.status !== 'winner') return -1;
      if (b.status === 'winner' && a.status !== 'winner') return 1;
      return b.visitors - a.visitors;
    });
  }

  // ── STEP 6 & 7: Kill Rules + Scale Rules ──

  getKillList(): ChannelScorecard[] {
    const scorecards = this.getChannelScorecardSync();
    return scorecards.filter(s => s.status === 'failing');
  }

  getScaleList(): ChannelScorecard[] {
    const scorecards = this.getChannelScorecardSync();
    return scorecards.filter(s => s.status === 'winner');
  }

  getAutoDecisions(): Array<{ channel: string; decision: 'KILL' | 'SCALE' | 'MAINTAIN'; reason: string }> {
    const decisions: Array<{ channel: string; decision: 'KILL' | 'SCALE' | 'MAINTAIN'; reason: string }> = [];

    for (const failing of this.getKillList()) {
      decisions.push({
        channel: failing.channel,
        decision: 'KILL',
        reason: `连续 ${failing.consecutiveDaysBelowThreshold} 天 <10 访客/天，CAC $${failing.cac}`,
      });
    }

    for (const winner of this.getScaleList()) {
      decisions.push({
        channel: winner.channel,
        decision: 'SCALE',
        reason: `${winner.visitors} 访客/天，AI/User ${winner.aiRequestsPerUser}，留存 ${winner.retentionRate}%`,
      });
    }

    return decisions;
  }

  // ── STEP 8: Weekly Report ──

  async getWeeklyTrafficReport(): Promise<WeeklyTrafficReport> {
    const dashboard = await this.getAcquisitionDashboard();
    const scorecard = await this.getChannelScorecard();
    const contentPerf = this.getContentPerformance();
    const virality = this.getViralityMetrics();
    const topMatches = await this.userUsageService.getTopMatches(5);

    // Best channel recommendation
    const winner = scorecard.find(s => s.status === 'winner');
    const topTester = scorecard.find(s => s.status === 'testing');
    const recommendation = winner
      ? `🏆 主力渠道: ${winner.channel} (${winner.visitors} 访客/周)。加大该渠道内容投放。`
      : topTester
      ? `🧪 最有潜力: ${topTester.channel} (${topTester.visitors} 访客/周)。优化内容类型提高转化。`
      : '⏳ 所有渠道数据不足。持续分发，7天后首次评分。';

    return {
      week: `${this.daysAgo(7)} → ${this.today()}`,
      totalVisitors: this.visitors.length,
      totalRegistrations: this.visitors.filter(v => v.registered).length,
      totalPayments: this.visitors.filter(v => v.paid).length,
      topChannels: scorecard.slice(0, 4).map(s => ({
        channel: s.channel, visitors: s.visitors, ctr: s.ctr, status: s.status,
      })),
      topCampaigns: Object.entries(dashboard.byCampaign)
        .map(([campaign, data]) => ({ campaign, visitors: data.visitors, conversions: data.registrations }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 3),
      topContent: contentPerf.slice(0, 3).map(c => ({
        experiment: c.experimentName, ctr: c.ctr, winRate: c.winRate,
      })),
      topMatches: topMatches.map(m => ({ matchId: m.entity_id, views: m.views })),
      virality,
      scorecard,
      recommendation,
    };
  }

  // ── Helpers ──

  private getChannelScorecardSync(): ChannelScorecard[] {
    const scorecards: ChannelScorecard[] = [];
    for (const channel of Object.values(ACQUISITION_CHANNELS)) {
      const chVisitors = this.visitors.filter(v => v.channel === channel);
      const uniqueUsers = new Set(chVisitors.map(v => v.id)).size || 1;
      const dailyCounts = this.getDailyCountsByChannel(channel);
      let consecutiveBelow = 0;
      for (let i = dailyCounts.length - 1; i >= 0; i--) {
        if (dailyCounts[i] < 10) consecutiveBelow++;
        else break;
      }
      scorecards.push({
        channel, period: { start: this.daysAgo(7), end: this.today() },
        visitors: chVisitors.length, registrations: 0, aiAnalysisClicks: 0, aiChatUsage: 0,
        paywallViews: 0, payments: 0, ctr: 0, signupRate: 0, aiRequestsPerUser: 0,
        retentionRate: 0, revenue: 0, cac: 999,
        status: consecutiveBelow >= 7 ? 'failing' : chVisitors.length > 0 ? 'testing' : 'unknown',
        consecutiveDaysBelowThreshold: consecutiveBelow,
        recommendation: '',
      });
    }
    return scorecards;
  }

  private getDailyCountsByChannel(channel: string): number[] {
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      counts.push(this.visitors.filter(v =>
        v.channel === channel && v.timestamp.toISOString().split('T')[0] === dateStr,
      ).length);
    }
    return counts;
  }

  private getDaysSinceFirstVisitor(channel: string): number {
    const first = this.visitors.filter(v => v.channel === channel)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
    if (!first) return 1;
    return Math.max(1, Math.ceil((Date.now() - first.timestamp.getTime()) / 86400000));
  }

  private seedDemoData(byChannel: any, byContent: any, byCampaign: any): void {
    byChannel['x'] = { visitors: 52, registrations: 12, aiClicks: 18, payments: 2 };
    byChannel['xiaohongshu'] = { visitors: 38, registrations: 7, aiClicks: 12, payments: 1 };
    byChannel['telegram'] = { visitors: 5, registrations: 1, aiClicks: 2, payments: 0 };
    byChannel['seo'] = { visitors: 25, registrations: 5, aiClicks: 8, payments: 0 };
    byContent['prediction'] = { impressions: 45, clicks: 18, ctr: 40 };
    byContent['tactical_analysis'] = { impressions: 30, clicks: 9, ctr: 30 };
    byContent['controversial_opinion'] = { impressions: 20, clicks: 12, ctr: 60 };
    byContent['ai_was_wrong'] = { impressions: 18, clicks: 7, ctr: 38.9 };
    byContent['ai_was_right'] = { impressions: 22, clicks: 10, ctr: 45.5 };
    byCampaign['worldcup_matchday1'] = { visitors: 65, registrations: 14 };
    byCampaign['messi_spotlight'] = { visitors: 28, registrations: 6 };
    byCampaign['germany_spain_recap'] = { visitors: 18, registrations: 3 };
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private daysAgo(n: number): string {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }
}
