import { Injectable, Logger } from '@nestjs/common';

interface ConversionSignal {
  userId: string;
  type: 'upgrade_click' | 'pricing_view' | 'feature_preview_click' | 'subscription_start' | 'subscription_cancel';
  feature?: string;
  source?: string;
  timestamp: Date;
}

interface MonetizationDashboard {
  period: { start: string; end: string };
  funnel: {
    total_free_users: number;
    saw_preview: number;
    clicked_upgrade: number;
    viewed_pricing: number;
    started_subscription: number;
    conversion_rate: number;
  };
  revenue: {
    estimated_mrr: number;
    projected_arr: number;
    paying_users: number;
    avg_revenue_per_user: number;
  };
  signals: {
    prediction_requests: number;
    tactics_requests: number;
    premium_intent_score: number;
    top_conversion_source: string;
  };
  recommendations: string[];
}

@Injectable()
export class MonetizationAnalyticsService {
  private readonly logger = new Logger(MonetizationAnalyticsService.name);
  private signals: ConversionSignal[] = [];

  trackSignal(signal: Omit<ConversionSignal, 'timestamp'>): void {
    this.signals.push({ ...signal, timestamp: new Date() });
    this.logger.log(
      `[Monetization] ${signal.type} | user=${signal.userId.substring(0, 8)} | feature=${signal.feature || 'n/a'}`,
    );
  }

  getDashboard(): MonetizationDashboard {
    const now = new Date();
    const daysAgo30 = new Date(now.getTime() - 30 * 86400000);

    const recentSignals = this.signals.filter(s => s.timestamp >= daysAgo30);
    const uniqueUsers = new Set(recentSignals.map(s => s.userId));

    const clicks = recentSignals.filter(s => s.type === 'upgrade_click').length;
    const previews = recentSignals.filter(s => s.type === 'feature_preview_click').length;
    const pricing = recentSignals.filter(s => s.type === 'pricing_view').length;
    const subs = recentSignals.filter(s => s.type === 'subscription_start').length;

    const predRequests = recentSignals.filter(
      s => s.feature === 'prediction' || s.feature === 'prediction',
    ).length;
    const tacticsRequests = recentSignals.filter(
      s => s.feature === 'tactics' || s.feature === 'tactics',
    ).length;

    // Premium intent: ratio of premium questions to total
    const total = recentSignals.length || 1;
    const premiumScore = Math.round(((predRequests + tacticsRequests) / total) * 100);

    // Top conversion source
    const sources = recentSignals
      .filter(s => s.type === 'upgrade_click' && s.source)
      .reduce((acc, s) => {
        acc[s.source!] = (acc[s.source!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    const recommendations: string[] = [];
    if (premiumScore < 20) recommendations.push('提升 Pro 功能的可见性');
    if (clicks > 0 && subs / Math.max(clicks, 1) < 0.1) recommendations.push('优化升级流程，降低转化摩擦');
    if (previews > clicks * 2) recommendations.push('预览内容有吸引力但 CTA 不够突出');
    if (recommendations.length === 0) recommendations.push('商业化漏斗运行正常，持续监控');

    return {
      period: {
        start: daysAgo30.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      },
      funnel: {
        total_free_users: uniqueUsers.size,
        saw_preview: previews,
        clicked_upgrade: clicks,
        viewed_pricing: pricing,
        started_subscription: subs,
        conversion_rate: uniqueUsers.size > 0
          ? Math.round((subs / uniqueUsers.size) * 10000) / 100
          : 0,
      },
      revenue: {
        estimated_mrr: subs * 9.9,
        projected_arr: subs * 9.9 * 12,
        paying_users: subs,
        avg_revenue_per_user: uniqueUsers.size > 0
          ? Math.round((subs * 9.9 / uniqueUsers.size) * 100) / 100
          : 0,
      },
      signals: {
        prediction_requests: predRequests,
        tactics_requests: tacticsRequests,
        premium_intent_score: premiumScore,
        top_conversion_source: topSource,
      },
      recommendations,
    };
  }
}
