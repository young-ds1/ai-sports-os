import { Injectable, Logger } from '@nestjs/common';

/**
 * PricingTestService — A/B tests different price points to find optimal pricing.
 *
 * Pro tier test buckets:  $5/mo, $9/mo, $12/mo
 * Elite tier test buckets: $19/mo, $29/mo
 *
 * Assignment: deterministic hash of user_id → consistent price across sessions.
 * Goal: measure price elasticity — how many users convert at each price point.
 */

export interface PriceBucket {
  tier: 'pro' | 'elite';
  priceId: string;
  monthlyPrice: number;
  annualPrice: number;
  displayName: string;
  weight: number; // % of users assigned
}

export interface PricingTestResult {
  tier: string;
  bucket: PriceBucket;
  impressions: number;       // Users who saw this price
  conversions: number;       // Users who paid at this price
  conversionRate: number;    // conversions / impressions
  revenuePerImpression: number; // monthlyPrice * conversionRate
  optimalPrice: boolean;     // Is this the best-performing bucket?
}

const PRO_BUCKETS: PriceBucket[] = [
  { tier: 'pro', priceId: 'pro_5', monthlyPrice: 5, annualPrice: 48, displayName: 'Pro', weight: 40 },
  { tier: 'pro', priceId: 'pro_9', monthlyPrice: 9, annualPrice: 86, displayName: 'Pro', weight: 40 },
  { tier: 'pro', priceId: 'pro_12', monthlyPrice: 12, annualPrice: 115, displayName: 'Pro', weight: 20 },
];

const ELITE_BUCKETS: PriceBucket[] = [
  { tier: 'elite', priceId: 'elite_19', monthlyPrice: 19, annualPrice: 182, displayName: 'Elite', weight: 50 },
  { tier: 'elite', priceId: 'elite_29', monthlyPrice: 29, annualPrice: 278, displayName: 'Elite', weight: 50 },
];

@Injectable()
export class PricingTestService {
  private readonly logger = new Logger(PricingTestService.name);

  // Impression & conversion tracking per bucket
  private impressions: Record<string, Set<string>> = {};  // priceId → userIds
  private conversions: Record<string, Set<string>> = {};

  constructor() {
    for (const b of [...PRO_BUCKETS, ...ELITE_BUCKETS]) {
      this.impressions[b.priceId] = new Set();
      this.conversions[b.priceId] = new Set();
    }
  }

  /**
   * Assign a user to a price bucket. Deterministic — same user always sees same price.
   */
  assignPrice(userId: string, tier: 'pro' | 'elite'): PriceBucket {
    const buckets = tier === 'pro' ? PRO_BUCKETS : ELITE_BUCKETS;
    const hash = this.hashString(userId + tier);
    const percentile = hash % 100;

    let cumulative = 0;
    for (const bucket of buckets) {
      cumulative += bucket.weight;
      if (percentile < cumulative) {
        this.impressions[bucket.priceId].add(userId);
        return bucket;
      }
    }

    return buckets[0];
  }

  /**
   * Get the pricing shown to a specific user (with annual discount displayed).
   */
  getPricingForUser(userId: string): {
    pro: { monthly: number; annual: number; annualMonthlyEquivalent: number; savingsPercent: number };
    elite: { monthly: number; annual: number; annualMonthlyEquivalent: number; savingsPercent: number };
  } {
    const proBucket = this.assignPrice(userId, 'pro');
    const eliteBucket = this.assignPrice(userId, 'elite');

    return {
      pro: {
        monthly: proBucket.monthlyPrice,
        annual: proBucket.annualPrice,
        annualMonthlyEquivalent: Math.round(proBucket.annualPrice / 12),
        savingsPercent: Math.round((1 - proBucket.annualPrice / (proBucket.monthlyPrice * 12)) * 100),
      },
      elite: {
        monthly: eliteBucket.monthlyPrice,
        annual: eliteBucket.annualPrice,
        annualMonthlyEquivalent: Math.round(eliteBucket.annualPrice / 12),
        savingsPercent: Math.round((1 - eliteBucket.annualPrice / (eliteBucket.monthlyPrice * 12)) * 100),
      },
    };
  }

  /**
   * Track a conversion at a specific price point.
   */
  trackConversion(userId: string, tier: 'pro' | 'elite'): void {
    const bucket = this.assignPrice(userId, tier);
    this.conversions[bucket.priceId].add(userId);
    this.logger.log(
      `[PricingTest] Conversion: user=${userId.substring(0, 8)} tier=${tier} price=$${bucket.monthlyPrice}`,
    );
  }

  /**
   * Get complete pricing test results.
   */
  getResults(): { pro: PricingTestResult[]; elite: PricingTestResult[]; summary: string } {
    const proResults = this.bucketResults(PRO_BUCKETS);
    const eliteResults = this.bucketResults(ELITE_BUCKETS);

    // Find optimal price per tier (highest revenue per impression)
    const bestPro = proResults.sort((a, b) => b.revenuePerImpression - a.revenuePerImpression)[0];
    const bestElite = eliteResults.sort((a, b) => b.revenuePerImpression - a.revenuePerImpression)[0];

    // Summary insights
    const parts: string[] = [];
    if (bestPro) parts.push(`Pro 最优定价: $${bestPro.bucket.monthlyPrice}/月 (RPI: $${bestPro.revenuePerImpression.toFixed(2)})`);
    if (bestElite) parts.push(`Elite 最优定价: $${bestElite.bucket.monthlyPrice}/月 (RPI: $${bestElite.revenuePerImpression.toFixed(2)})`);

    if (proResults.length >= 2) {
      const rpiSpread = proResults.map(r => r.revenuePerImpression);
      const maxRpi = Math.max(...rpiSpread);
      const minRpi = Math.min(...rpiSpread.filter(r => r > 0));
      if (minRpi > 0 && maxRpi / minRpi > 1.5) {
        parts.push('⚠️ 价格弹性显著 — 建议进一步细分测试');
      }
    }

    return {
      pro: proResults,
      elite: eliteResults,
      summary: parts.join(' | ') || '等待更多转化数据',
    };
  }

  private bucketResults(buckets: PriceBucket[]): PricingTestResult[] {
    return buckets.map(bucket => {
      const imp = this.impressions[bucket.priceId]?.size || 0;
      const conv = this.conversions[bucket.priceId]?.size || 0;
      const rate = imp > 0 ? conv / imp : 0;

      return {
        tier: bucket.tier,
        bucket,
        impressions: imp,
        conversions: conv,
        conversionRate: Math.round(rate * 10000) / 100,
        revenuePerImpression: Math.round(bucket.monthlyPrice * rate * 100) / 100,
        optimalPrice: false, // Set below
      };
    }).map(r => {
      const bestInTier = [...buckets]
        .map(b => {
          const i = this.impressions[b.priceId]?.size || 0;
          const c = this.conversions[b.priceId]?.size || 0;
          return b.monthlyPrice * (i > 0 ? c / i : 0);
        })
        .reduce((max, val) => Math.max(max, val), 0);
      return { ...r, optimalPrice: r.revenuePerImpression >= bestInTier && r.conversions > 0 };
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
