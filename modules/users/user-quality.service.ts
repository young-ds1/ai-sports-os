import { Injectable, Logger } from '@nestjs/common';

// ── User Quality Score ──
// Components (weighted):
//   AI Analysis Usage     × 25%
//   AI Chat Usage         × 30%
//   Return Visits         × 20%
//   Session Depth         × 10%
//   Paywall Exposure      × 10%
//   Upgrade Click         ×  5%

interface UserProfile {
  userId: string;
  channel: string;
  contentExperiment: string;
  aiAnalysisCount: number;
  aiChatCount: number;
  returnVisits: number;
  totalSessions: number;
  avgSessionDepth: number;   // pages per session
  sawPaywall: boolean;
  clickedUpgrade: boolean;
  paid: boolean;
  firstSeen: Date;
  lastSeen: Date;
  qualityScore: number;
  intent: 'high' | 'medium' | 'low';
}

interface ChannelQuality {
  channel: string;
  totalVisitors: number;
  avgQualityScore: number;
  medianQualityScore: number;
  highIntentPct: number;
  mediumIntentPct: number;
  lowIntentPct: number;
  aiRequestsPerUser: number;
  retentionRate: number;
  payments: number;
  revenue: number;
  // Rank (1 = best quality, not most traffic)
  qualityRank: number;
  trafficRank: number;
  verdict: 'premium_channel' | 'volume_channel' | 'mixed' | 'poor';
}

interface ContentQuality {
  experimentName: string;
  impressions: number;
  registrations: number;
  avgUserQualityScore: number;
  aiRequestsPerUser: number;
  retentionRate: number;
  shareRate: number;
  // Rank by downstream engagement, not clicks
  engagementRank: number;
  ctrRank: number;
  verdict: 'high_engagement' | 'high_ctr_low_engagement' | 'low_performance';
}

interface ShareLoopAnalysis {
  totalSharers: number;
  totalShares: number;
  sharesPerSharer: number;
  invitedUsers: number;
  invitedUserQualityScore: number;
  topSharingContent: Array<{ experiment: string; shares: number; invitedQuality: number }>;
  viralCoefficient: number; // invited users / sharers
}

interface WeeklyQualityReport {
  week: string;
  bestChannel: { name: string; qualityScore: number; reason: string };
  bestContent: { name: string; engagementScore: number; reason: string };
  highestQualitySegment: { intent: string; pct: number; aiPerUser: number };
  mostSharedContent: { experiment: string; shares: number };
  highestRevenueSource: { channel: string; revenue: number };
  qualityDistribution: { high: number; medium: number; low: number };
  scaleCandidates: string[];
  killCandidates: string[];
  recommendation: string;
}

@Injectable()
export class UserQualityService {
  private readonly logger = new Logger(UserQualityService.name);
  private users = new Map<string, UserProfile>();
  private shareRecords: Array<{ sharerId: string; invitedId: string; contentExperiment: string; timestamp: Date }> = [];

  // ── User Profile Building ──

  trackUserAction(params: {
    userId: string; channel: string; contentExperiment: string;
    action: 'page_view' | 'ai_analysis' | 'ai_chat' | 'paywall_view' | 'upgrade_click' | 'payment' | 'share';
    invitedBy?: string;
  }): void {
    let user = this.users.get(params.userId);
    if (!user) {
      user = {
        userId: params.userId,
        channel: params.channel,
        contentExperiment: params.contentExperiment,
        aiAnalysisCount: 0,
        aiChatCount: 0,
        returnVisits: 0,
        totalSessions: 1,
        avgSessionDepth: 1,
        sawPaywall: false,
        clickedUpgrade: false,
        paid: false,
        firstSeen: new Date(),
        lastSeen: new Date(),
        qualityScore: 0,
        intent: 'low',
      };
    }

    // Update counters based on action
    switch (params.action) {
      case 'ai_analysis': user.aiAnalysisCount++; break;
      case 'ai_chat': user.aiChatCount++; break;
      case 'page_view': user.returnVisits++; user.totalSessions++; break;
      case 'paywall_view': user.sawPaywall = true; break;
      case 'upgrade_click': user.clickedUpgrade = true; break;
      case 'payment': user.paid = true; break;
      case 'share':
        if (params.invitedBy) {
          this.shareRecords.push({
            sharerId: params.invitedBy,
            invitedId: params.userId,
            contentExperiment: params.contentExperiment,
            timestamp: new Date(),
          });
        }
        break;
    }

    user.lastSeen = new Date();
    user.avgSessionDepth = user.totalSessions > 0
      ? Math.round((user.returnVisits / user.totalSessions + 1) * 10) / 10
      : 1;

    // Recalculate quality score
    user.qualityScore = this.calculateQualityScore(user);
    user.intent = user.qualityScore >= 61 ? 'high' : user.qualityScore >= 31 ? 'medium' : 'low';

    this.users.set(params.userId, user);
  }

  // ── STEP 1: Quality Score Calculation ──

  private calculateQualityScore(user: UserProfile): number {
    // AI Analysis: 0-25 points (max at 5+ analyses)
    const analysisScore = Math.min(25, user.aiAnalysisCount * 5);

    // AI Chat: 0-30 points (max at 10+ messages — this is the strongest signal)
    const chatScore = Math.min(30, user.aiChatCount * 3);

    // Return visits: 0-20 points (max at 7+ return visits)
    const returnScore = Math.min(20, user.returnVisits * 3);

    // Session depth: 0-10 points (max at 5+ pages/session)
    const depthScore = Math.min(10, Math.round(user.avgSessionDepth * 2));

    // Paywall exposure: 0-10 points (binary — saw it = engaged enough to trigger it)
    const paywallScore = user.sawPaywall ? 10 : 0;

    // Upgrade intent: 0-5 points
    const upgradeScore = user.clickedUpgrade ? 5 : 0;

    return Math.min(100, analysisScore + chatScore + returnScore + depthScore + paywallScore + upgradeScore);
  }

  // ── User Quality Distribution ──

  getUserQualityDistribution(): { high: number; medium: number; low: number; total: number } {
    const all = Array.from(this.users.values());
    return {
      high: all.filter(u => u.intent === 'high').length,
      medium: all.filter(u => u.intent === 'medium').length,
      low: all.filter(u => u.intent === 'low').length,
      total: all.length,
    };
  }

  // ── STEP 2: Channel Quality Report ──

  getChannelQualityReport(): { channels: ChannelQuality[]; summary: string } {
    const byChannel = new Map<string, UserProfile[]>();

    for (const user of this.users.values()) {
      if (!byChannel.has(user.channel)) byChannel.set(user.channel, []);
      byChannel.get(user.channel)!.push(user);
    }

    const channels: ChannelQuality[] = [];

    for (const [channel, users] of byChannel) {
      const scores = users.map(u => u.qualityScore).sort((a, b) => a - b);
      const avgScore = Math.round(users.reduce((s, u) => s + u.qualityScore, 0) / users.length);
      const medianScore = scores[Math.floor(scores.length / 2)] || 0;
      const highPct = Math.round((users.filter(u => u.intent === 'high').length / users.length) * 100);
      const mediumPct = Math.round((users.filter(u => u.intent === 'medium').length / users.length) * 100);
      const lowPct = Math.round((users.filter(u => u.intent === 'low').length / users.length) * 100);
      const aiPerUser = Math.round((users.reduce((s, u) => s + u.aiChatCount, 0) / Math.max(users.length, 1)) * 10) / 10;
      const returningUsers = users.filter(u => u.returnVisits > 0).length;
      const retentionRate = Math.round((returningUsers / Math.max(users.length, 1)) * 100);
      const payingUsers = users.filter(u => u.paid).length;

      // Verdict based on quality, not volume
      let verdict: ChannelQuality['verdict'];
      if (avgScore >= 50 && highPct >= 30) verdict = 'premium_channel';
      else if (users.length >= 20 && avgScore < 30) verdict = 'volume_channel';
      else if (avgScore >= 40) verdict = 'mixed';
      else verdict = 'poor';

      channels.push({
        channel, totalVisitors: users.length, avgQualityScore: avgScore,
        medianQualityScore: medianScore, highIntentPct: highPct, mediumIntentPct: mediumPct,
        lowIntentPct: lowPct, aiRequestsPerUser: aiPerUser, retentionRate,
        payments: payingUsers, revenue: payingUsers * 9,
        qualityRank: 0, trafficRank: 0, verdict,
      });
    }

    // Rank by quality score (descending), not traffic
    channels.sort((a, b) => b.avgQualityScore - a.avgQualityScore);
    channels.forEach((c, i) => { c.qualityRank = i + 1; });

    // Also compute traffic rank for comparison
    const byTraffic = [...channels].sort((a, b) => b.totalVisitors - a.totalVisitors);
    byTraffic.forEach((c, i) => { c.trafficRank = i + 1; });

    // Update scale candidates: visitors>100 AND AI/User>1.0 AND D7>20% AND Quality>60
    channels.forEach(c => {
      if (c.totalVisitors > 100 && c.aiRequestsPerUser > 1.0 && c.retentionRate > 20 && c.avgQualityScore > 60) {
        c.verdict = 'premium_channel';
      }
      if (c.totalVisitors > 100 && c.avgQualityScore < 30 && c.retentionRate < 15) {
        c.verdict = 'poor';
      }
    });

    // Seed demo data if empty
    if (channels.length === 0) {
      return this.seedChannelQualityDemo();
    }

    const bestQuality = channels[0];
    const worstQuality = channels[channels.length - 1];
    const summary = `🏆 最佳质量渠道: ${bestQuality.channel} (质量分 ${bestQuality.avgQualityScore}，高意图用户 ${bestQuality.highIntentPct}%)。` +
      `质量排名 ≠ 流量排名。${worstQuality.channel} 流量第 ${worstQuality.trafficRank} 但质量第 ${worstQuality.qualityRank}。`;

    return { channels, summary };
  }

  // ── STEP 3: Content Quality Report ──

  getContentQualityReport(): { content: ContentQuality[]; summary: string } {
    const byExperiment = new Map<string, UserProfile[]>();

    for (const user of this.users.values()) {
      if (!byExperiment.has(user.contentExperiment)) byExperiment.set(user.contentExperiment, []);
      byExperiment.get(user.contentExperiment)!.push(user);
    }

    const content: ContentQuality[] = [];
    const totalShares = this.shareRecords.length;

    for (const [experiment, users] of byExperiment) {
      const avgQuality = Math.round(users.reduce((s, u) => s + u.qualityScore, 0) / Math.max(users.length, 1));
      const aiPerUser = Math.round((users.reduce((s, u) => s + u.aiChatCount, 0) / Math.max(users.length, 1)) * 10) / 10;
      const returning = users.filter(u => u.returnVisits > 0).length;
      const retention = Math.round((returning / Math.max(users.length, 1)) * 100);
      const shares = this.shareRecords.filter(s => s.sharerId && users.some(u => u.userId === s.sharerId)).length;
      const shareRate = users.length > 0 ? Math.round((shares / users.length) * 100) : 0;
      const registrations = users.length;

      // Verdict based on downstream engagement, not CTR
      let verdict: ContentQuality['verdict'];
      if (aiPerUser >= 2.0 && retention >= 30) verdict = 'high_engagement';
      else if (registrations >= 10 && aiPerUser < 1.0) verdict = 'high_ctr_low_engagement';
      else verdict = 'low_performance';

      content.push({
        experimentName: experiment, impressions: users.length * 3,
        registrations, avgUserQualityScore: avgQuality,
        aiRequestsPerUser: aiPerUser, retentionRate: retention, shareRate,
        engagementRank: 0, ctrRank: 0, verdict,
      });
    }

    // Rank by downstream engagement (AI requests per user), not impressions
    content.sort((a, b) => b.aiRequestsPerUser - a.aiRequestsPerUser);
    content.forEach((c, i) => { c.engagementRank = i + 1; });

    // CTR rank for comparison
    const byReg = [...content].sort((a, b) => b.registrations - a.registrations);
    byReg.forEach((c, i) => { c.ctrRank = i + 1; });

    if (content.length === 0) {
      return this.seedContentQualityDemo();
    }

    const topEngagement = content[0];
    const summary = `🏆 最佳互动内容: ${topEngagement.experimentName} (AI/User=${topEngagement.aiRequestsPerUser}，留存=${topEngagement.retentionRate}%)。` +
      `注意：CTR 排名 ≠ 互动排名。选择高互动内容，不是高点击内容。`;

    return { content, summary };
  }

  // ── STEP 4: Share Loop Analysis ──

  getShareLoopAnalysis(): ShareLoopAnalysis {
    const sharers = new Set(this.shareRecords.map(s => s.sharerId));
    const invited = new Set(this.shareRecords.map(s => s.invitedId));
    const invitedUsers = Array.from(invited).map(id => this.users.get(id)).filter(Boolean) as UserProfile[];
    const avgInvitedQuality = invitedUsers.length > 0
      ? Math.round(invitedUsers.reduce((s, u) => s + u.qualityScore, 0) / invitedUsers.length)
      : 0;

    // Top sharing content
    const byContent = new Map<string, number>();
    for (const s of this.shareRecords) {
      byContent.set(s.contentExperiment, (byContent.get(s.contentExperiment) || 0) + 1);
    }
    const topSharing = Array.from(byContent.entries())
      .map(([experiment, shares]) => ({
        experiment, shares,
        invitedQuality: Math.round(
          this.shareRecords
            .filter(s => s.contentExperiment === experiment)
            .reduce((sum, s) => {
              const u = this.users.get(s.invitedId);
              return sum + (u?.qualityScore || 0);
            }, 0) / Math.max(shares, 1),
        ),
      }))
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 3);

    const viralCoefficient = sharers.size > 0
      ? Math.round((invited.size / sharers.size) * 100) / 100
      : 0;

    if (this.shareRecords.length === 0) {
      return this.seedShareLoopDemo();
    }

    return {
      totalSharers: sharers.size,
      totalShares: this.shareRecords.length,
      sharesPerSharer: sharers.size > 0 ? Math.round((this.shareRecords.length / sharers.size) * 10) / 10 : 0,
      invitedUsers: invited.size,
      invitedUserQualityScore: avgInvitedQuality,
      topSharingContent: topSharing,
      viralCoefficient,
    };
  }

  // ── STEP 5-6: Updated Scale/Kill Criteria ──

  getQualityBasedDecisions(): {
    scaleCandidates: string[];
    killCandidates: string[];
    decisions: Array<{ channel: string; decision: string; reason: string }>;
  } {
    const report = this.getChannelQualityReport();
    const decisions: Array<{ channel: string; decision: string; reason: string }> = [];
    const scaleCandidates: string[] = [];
    const killCandidates: string[] = [];

    for (const ch of report.channels) {
      // SCALE: visitors>100 AND AI/User>1.0 AND D7>20% AND Quality>60
      if (ch.totalVisitors > 100 && ch.aiRequestsPerUser > 1.0 && ch.retentionRate > 20 && ch.avgQualityScore > 60) {
        scaleCandidates.push(ch.channel);
        decisions.push({
          channel: ch.channel, decision: 'SCALE',
          reason: `质量分${ch.avgQualityScore}>60 + AI/User${ch.aiRequestsPerUser}>1.0 + 留存${ch.retentionRate}%>20% — 高质量渠道，值得扩量`,
        });
      }
      // KILL: visitors>100 AND Quality<30 for 14 consecutive days
      else if (ch.totalVisitors > 100 && ch.avgQualityScore < 30 && ch.highIntentPct < 10) {
        killCandidates.push(ch.channel);
        decisions.push({
          channel: ch.channel, decision: 'KILL',
          reason: `访客>100但质量分${ch.avgQualityScore}<30，高意图用户仅${ch.highIntentPct}% — 垃圾流量，建议停止`,
        });
      }
    }

    // Never kill based on tiny samples
    if (decisions.length === 0) {
      decisions.push({
        channel: 'all', decision: 'OBSERVE',
        reason: '无渠道同时满足 visitors>100 + 质量分极端（>60扩量 / <30砍掉）。样本不足时不做决策。',
      });
    }

    return { scaleCandidates, killCandidates, decisions };
  }

  // ── STEP 7: Weekly Quality Report ──

  getWeeklyQualityReport(): WeeklyQualityReport {
    const channelReport = this.getChannelQualityReport();
    const contentReport = this.getContentQualityReport();
    const shareLoop = this.getShareLoopAnalysis();
    const distribution = this.getUserQualityDistribution();
    const qualityDecisions = this.getQualityBasedDecisions();

    const bestCh = channelReport.channels[0];
    const bestContent = contentReport.content[0];
    const highestRevenue = channelReport.channels
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)[0];

    return {
      week: `${this.daysAgo(7)} → ${this.today()}`,
      bestChannel: {
        name: bestCh?.channel || '数据不足',
        qualityScore: bestCh?.avgQualityScore || 0,
        reason: bestCh ? `质量分 ${bestCh.avgQualityScore}，高意图用户 ${bestCh.highIntentPct}%` : '等待数据',
      },
      bestContent: {
        name: bestContent?.experimentName || '数据不足',
        engagementScore: bestContent?.aiRequestsPerUser || 0,
        reason: bestContent ? `AI/User=${bestContent.aiRequestsPerUser}，留存=${bestContent.retentionRate}%` : '等待数据',
      },
      highestQualitySegment: {
        intent: 'high',
        pct: distribution.total > 0 ? Math.round((distribution.high / distribution.total) * 100) : 0,
        aiPerUser: 0,
      },
      mostSharedContent: {
        experiment: shareLoop.topSharingContent[0]?.experiment || '数据不足',
        shares: shareLoop.topSharingContent[0]?.shares || 0,
      },
      highestRevenueSource: {
        channel: highestRevenue?.channel || '暂无',
        revenue: highestRevenue?.revenue || 0,
      },
      qualityDistribution: distribution,
      scaleCandidates: qualityDecisions.scaleCandidates,
      killCandidates: qualityDecisions.killCandidates,
      recommendation: bestCh
        ? `优先投入 ${bestCh.channel}（${bestCh.avgQualityScore} 质量分）。内容侧推 ${bestContent?.experimentName || '预测类'}（AI/User=${bestContent?.aiRequestsPerUser || 0}）。质量 > 数量。`
        : '数据不足。持续追踪用户质量，7天后首次评分。质量 > 数量。',
    };
  }

  // ── Helpers ──

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private daysAgo(n: number): string {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  // ── Demo Seed Data ──

  private seedChannelQualityDemo(): { channels: ChannelQuality[]; summary: string } {
    const channels: ChannelQuality[] = [
      { channel: 'x', totalVisitors: 85, avgQualityScore: 62, medianQualityScore: 65, highIntentPct: 35, mediumIntentPct: 45, lowIntentPct: 20, aiRequestsPerUser: 2.8, retentionRate: 42, payments: 3, revenue: 27, qualityRank: 1, trafficRank: 1, verdict: 'premium_channel' },
      { channel: 'xiaohongshu', totalVisitors: 45, avgQualityScore: 48, medianQualityScore: 50, highIntentPct: 20, mediumIntentPct: 40, lowIntentPct: 40, aiRequestsPerUser: 1.5, retentionRate: 28, payments: 1, revenue: 9, qualityRank: 2, trafficRank: 2, verdict: 'mixed' },
      { channel: 'seo', totalVisitors: 30, avgQualityScore: 28, medianQualityScore: 25, highIntentPct: 8, mediumIntentPct: 25, lowIntentPct: 67, aiRequestsPerUser: 0.6, retentionRate: 12, payments: 0, revenue: 0, qualityRank: 3, trafficRank: 3, verdict: 'poor' },
      { channel: 'telegram', totalVisitors: 8, avgQualityScore: 55, medianQualityScore: 58, highIntentPct: 30, mediumIntentPct: 50, lowIntentPct: 20, aiRequestsPerUser: 2.1, retentionRate: 38, payments: 0, revenue: 0, qualityRank: 4, trafficRank: 4, verdict: 'poor' },
    ];
    return { channels, summary: '🏆 X 是最佳质量渠道 (62分)。Telegram 流量最少但质量不低 —— 样本不足，不急于砍。SEO 流量30但质量28 —— 垃圾流量。' };
  }

  private seedContentQualityDemo(): { content: ContentQuality[]; summary: string } {
    const content: ContentQuality[] = [
      { experimentName: 'C. 争议观点', impressions: 60, registrations: 18, avgUserQualityScore: 58, aiRequestsPerUser: 3.2, retentionRate: 45, shareRate: 12, engagementRank: 1, ctrRank: 2, verdict: 'high_engagement' },
      { experimentName: 'A. 预测类', impressions: 90, registrations: 25, avgUserQualityScore: 45, aiRequestsPerUser: 2.1, retentionRate: 32, shareRate: 8, engagementRank: 2, ctrRank: 1, verdict: 'high_engagement' },
      { experimentName: 'E. AI神准', impressions: 35, registrations: 8, avgUserQualityScore: 52, aiRequestsPerUser: 1.8, retentionRate: 28, shareRate: 15, engagementRank: 3, ctrRank: 4, verdict: 'high_engagement' },
      { experimentName: 'B. 战术分析', impressions: 45, registrations: 12, avgUserQualityScore: 35, aiRequestsPerUser: 1.2, retentionRate: 22, shareRate: 5, engagementRank: 4, ctrRank: 3, verdict: 'high_ctr_low_engagement' },
      { experimentName: 'D. AI打脸', impressions: 25, registrations: 5, avgUserQualityScore: 25, aiRequestsPerUser: 0.5, retentionRate: 10, shareRate: 20, engagementRank: 5, ctrRank: 5, verdict: 'low_performance' },
    ];
    return { content, summary: '🏆 争议观点 AI/User=3.2 最佳互动。预测类 CTR 最高但互动不如争议。AI打脸 分享率20%最高但互动最低 —— 病毒≠留存。' };
  }

  private seedShareLoopDemo(): ShareLoopAnalysis {
    return {
      totalSharers: 8, totalShares: 15, sharesPerSharer: 1.9,
      invitedUsers: 5, invitedUserQualityScore: 42,
      topSharingContent: [
        { experiment: 'D. AI打脸', shares: 6, invitedQuality: 28 },
        { experiment: 'C. 争议观点', shares: 5, invitedQuality: 55 },
        { experiment: 'E. AI神准', shares: 4, invitedQuality: 48 },
      ],
      viralCoefficient: 0.63,
    };
  }
}
