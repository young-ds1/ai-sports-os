import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionTier } from '../users/subscriptions/tier-config';

interface SubscriptionRecord {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired';
  startedAt: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  provider: 'manual' | 'stripe';
  amount: number;
  currency: string;
}

export interface BillingEvent {
  id: string;
  subscriptionId: string;
  userId: string;
  event: 'created' | 'renewed' | 'cancelled' | 'expired' | 'upgraded' | 'downgraded';
  fromTier?: SubscriptionTier;
  toTier: SubscriptionTier;
  amount: number;
  currency: string;
  timestamp: Date;
  metadata?: Record<string, string>;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private subscriptions: SubscriptionRecord[] = [];
  // Production billing audit trail
  public billingEvents: BillingEvent[] = [];

  async getByUser(userId: string): Promise<SubscriptionRecord | null> {
    return this.subscriptions.find(
      s => s.userId === userId && s.status === 'active',
    ) || null;
  }

  async create(data: {
    userId: string;
    tier: SubscriptionTier;
    provider?: 'manual' | 'stripe';
    amount?: number;
    currency?: string;
    metadata?: Record<string, string>;
  }): Promise<SubscriptionRecord> {
    // If user already has active subscription, this is an upgrade/downgrade
    const existing = await this.getByUser(data.userId);
    const isUpgrade = existing && existing.tier !== data.tier;

    const amount = data.amount || (data.tier === SubscriptionTier.VIP ? 9 : data.tier === SubscriptionTier.PRO ? 29 : 0);
    const currency = data.currency || 'usd';

    const sub: SubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: data.userId,
      tier: data.tier,
      status: 'active',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
      provider: data.provider || 'manual',
      amount,
      currency,
    };

    // Cancel previous active subscription if upgrading
    if (isUpgrade && existing) {
      existing.status = 'cancelled';
      existing.cancelledAt = new Date();
    }

    this.subscriptions.push(sub);

    // Record billing event
    const eventType = isUpgrade
      ? (data.tier === SubscriptionTier.PRO && existing!.tier === SubscriptionTier.VIP ? 'upgraded' : 'upgraded')
      : 'created';

    this.recordBillingEvent({
      subscriptionId: sub.id,
      userId: data.userId,
      event: eventType,
      fromTier: existing?.tier,
      toTier: data.tier,
      amount,
      currency,
      metadata: data.metadata,
    });

    this.logger.log(
      `[Billing] ${eventType}: user=${data.userId.substring(0, 8)} tier=${data.tier} amount=$${amount} ${currency}`,
    );

    return sub;
  }

  async cancel(userId: string): Promise<void> {
    const sub = this.subscriptions.find(s => s.userId === userId && s.status === 'active');
    if (sub) {
      sub.status = 'cancelled';
      sub.cancelledAt = new Date();

      this.recordBillingEvent({
        subscriptionId: sub.id,
        userId,
        event: 'cancelled',
        toTier: sub.tier,
        amount: sub.amount,
        currency: sub.currency,
      });

      this.logger.log(`[Billing] cancelled: user=${userId.substring(0, 8)} tier=${sub.tier}`);
    }
  }

  async expire(userId: string): Promise<void> {
    const sub = this.subscriptions.find(s => s.userId === userId && s.status === 'active');
    if (sub) {
      sub.status = 'expired';
      this.recordBillingEvent({
        subscriptionId: sub.id,
        userId,
        event: 'expired',
        toTier: SubscriptionTier.FREE,
        amount: 0,
        currency: sub.currency,
        metadata: { previous_tier: sub.tier, reason: 'subscription_expired' },
      });
      this.logger.log(`[Billing] expired: user=${userId.substring(0, 8)} was ${sub.tier}`);
    }
  }

  getUserTier(userId: string): SubscriptionTier {
    const sub = this.subscriptions.find(s => s.userId === userId && s.status === 'active');
    return sub?.tier || SubscriptionTier.FREE;
  }

  getBillingEvents(userId?: string): BillingEvent[] {
    if (userId) return this.billingEvents.filter(e => e.userId === userId);
    return this.billingEvents;
  }

  getBillingSummary(): {
    totalRevenue: number;
    activeSubscriptions: number;
    byTier: Record<string, { count: number; mrr: number }>;
    eventsByType: Record<string, number>;
  } {
    const active = this.subscriptions.filter(s => s.status === 'active');
    const byTier: Record<string, { count: number; mrr: number }> = {};
    for (const s of active) {
      if (!byTier[s.tier]) byTier[s.tier] = { count: 0, mrr: 0 };
      byTier[s.tier].count++;
      byTier[s.tier].mrr += s.amount;
    }

    const eventsByType: Record<string, number> = {};
    for (const e of this.billingEvents) {
      eventsByType[e.event] = (eventsByType[e.event] || 0) + 1;
    }

    return {
      totalRevenue: active.reduce((s, sub) => s + sub.amount, 0),
      activeSubscriptions: active.length,
      byTier,
      eventsByType,
    };
  }

  getPricing(): Array<{
    tier: SubscriptionTier;
    name: string;
    price: string;
    features: string[];
    cta: string;
    highlighted: boolean;
  }> {
    return [
      {
        tier: SubscriptionTier.FREE,
        name: 'Free',
        price: '免费',
        features: ['每日 3 次 AI 分析', '基础赛事信息', '关键球员名称'],
        cta: '当前方案',
        highlighted: false,
      },
      {
        tier: SubscriptionTier.VIP,
        name: 'Pro',
        price: '$9/月',
        features: [
          '每日 50 次 AI 分析',
          '无限 AI 追问',
          '胜率预测 + 信心指数',
          '战术深度拆解',
          '球员表现量化评分',
          '冷门风险预警',
        ],
        cta: '升级 Pro',
        highlighted: true,
      },
      {
        tier: SubscriptionTier.PRO,
        name: 'Elite',
        price: '$29/月',
        features: [
          '全部 Pro 功能',
          '多场景模拟推演',
          '小组/淘汰赛晋级概率',
          'AI 趋势分析',
          'API 访问权限',
          '优先客服支持',
        ],
        cta: '升级 Elite',
        highlighted: false,
      },
    ];
  }

  private recordBillingEvent(params: Omit<BillingEvent, 'id' | 'timestamp'>): void {
    const event: BillingEvent = {
      id: `bevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...params,
      timestamp: new Date(),
    };
    this.billingEvents.push(event);
  }
}
