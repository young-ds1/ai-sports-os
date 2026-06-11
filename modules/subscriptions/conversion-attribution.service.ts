import { Injectable, Logger } from '@nestjs/common';

/**
 * ConversionAttributionService — measures WHICH feature or trigger drove a conversion.
 *
 * Answers the question: "What made this user pay?"
 * - Was it seeing a prediction preview?
 * - Was it hitting the daily limit?
 * - Was it the tactical analysis teaser?
 * - Was it the decision-value positioning?
 */

interface AttributionEvent {
  userId: string;
  feature: string;          // 'prediction' | 'tactics' | 'player_rating' | 'unlimited' | 'simulation'
  source: string;           // 'paywall_trigger' | 'preview_teaser' | 'daily_limit' | 'upgrade_page'
  timestamp: Date;
}

interface ConversionRecord {
  userId: string;
  tier: string;
  priceMonthly: number;
  convertedAt: Date;
  // Lookback window: which events preceded this conversion?
  precedingEvents: AttributionEvent[];
  attributedFeature: string;
  attributedSource: string;
  timeFromFirstTrigger: number; // minutes from first trigger to conversion
}

@Injectable()
export class ConversionAttributionService {
  private readonly logger = new Logger(ConversionAttributionService.name);
  private events: AttributionEvent[] = [];
  private conversions: ConversionRecord[] = [];

  /**
   * Track an attribution event (user saw a teaser, hit a limit, etc.)
   */
  trackEvent(userId: string, feature: string, source: string): void {
    this.events.push({ userId, feature, source, timestamp: new Date() });
  }

  /**
   * Record a conversion and attribute it to preceding events.
   */
  recordConversion(userId: string, tier: string, priceMonthly: number): ConversionRecord {
    const now = new Date();
    const lookbackMs = 30 * 60 * 1000; // 30-minute attribution window
    const recentEvents = this.events.filter(
      e => e.userId === userId && (now.getTime() - e.timestamp.getTime()) < lookbackMs,
    );

    // Attribution logic: last-touch with decay
    let attributedFeature = 'unknown';
    let attributedSource = 'unknown';

    if (recentEvents.length > 0) {
      // Weight: most recent event gets highest weight
      const sorted = recentEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      attributedFeature = sorted[0].feature;
      attributedSource = sorted[0].source;
    }

    const firstTrigger = recentEvents[0];
    const timeFromFirstTrigger = firstTrigger
      ? Math.round((now.getTime() - firstTrigger.timestamp.getTime()) / 60000)
      : -1;

    const record: ConversionRecord = {
      userId,
      tier,
      priceMonthly,
      convertedAt: now,
      precedingEvents: recentEvents,
      attributedFeature,
      attributedSource,
      timeFromFirstTrigger,
    };

    this.conversions.push(record);
    this.logger.log(
      `[Attribution] Conversion: user=${userId.substring(0, 8)} tier=${tier} ` +
      `attributed_to="${attributedFeature}" via "${attributedSource}" ` +
      `events=${recentEvents.length} time_to_convert=${timeFromFirstTrigger}min`,
    );

    return record;
  }

  /**
   * Get attribution analytics — which features drive the most conversions?
   */
  getAttributionReport(): {
    total_conversions: number;
    by_feature: Record<string, { conversions: number; percent: number; avgTimeToConvert: number }>;
    by_source: Record<string, { conversions: number; percent: number }>;
    top_conversion_path: string;
    recommendation: string;
  } {
    const total = this.conversions.length || 1;

    // By feature
    const byFeature: Record<string, { conversions: number; times: number[] }> = {};
    for (const c of this.conversions) {
      if (!byFeature[c.attributedFeature]) {
        byFeature[c.attributedFeature] = { conversions: 0, times: [] };
      }
      byFeature[c.attributedFeature].conversions++;
      if (c.timeFromFirstTrigger >= 0) byFeature[c.attributedFeature].times.push(c.timeFromFirstTrigger);
    }

    // By source
    const bySource: Record<string, number> = {};
    for (const c of this.conversions) {
      bySource[c.attributedSource] = (bySource[c.attributedSource] || 0) + 1;
    }

    // Top path
    const topFeature = Object.entries(byFeature)
      .sort((a, b) => b[1].conversions - a[1].conversions)[0];

    // Recommendation
    let recommendation = '等待更多转化数据分析';
    if (topFeature) {
      if (topFeature[0] === 'prediction') {
        recommendation = '预测功能是最强转化驱动 — 增加预测类预览展示频率';
      } else if (topFeature[0] === 'tactics') {
        recommendation = '战术分析转化力强 — 考虑在比赛详情页突出战术预览';
      } else if (topFeature[0] === 'daily_limit') {
        recommendation = '限额触达最有效 — 测试不同限额水平对转化的影响';
      }
    }

    return {
      total_conversions: this.conversions.length,
      by_feature: Object.fromEntries(
        Object.entries(byFeature).map(([k, v]) => [k, {
          conversions: v.conversions,
          percent: Math.round((v.conversions / total) * 100),
          avgTimeToConvert: v.times.length > 0
            ? Math.round(v.times.reduce((a, b) => a + b, 0) / v.times.length)
            : 0,
        }]),
      ),
      by_source: Object.fromEntries(
        Object.entries(bySource).map(([k, v]) => [k, {
          conversions: v,
          percent: Math.round((v / total) * 100),
        }]),
      ),
      top_conversion_path: topFeature
        ? `${topFeature[0]} (${topFeature[1].conversions} conversions, ${Math.round((topFeature[1].conversions / total) * 100)}%)`
        : 'unknown',
      recommendation,
    };
  }
}
