"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const tier_config_1 = require("../users/subscriptions/tier-config");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    logger = new common_1.Logger(SubscriptionsService_1.name);
    subscriptions = [];
    // Production billing audit trail
    billingEvents = [];
    async getByUser(userId) {
        return this.subscriptions.find(s => s.userId === userId && s.status === 'active') || null;
    }
    async create(data) {
        // If user already has active subscription, this is an upgrade/downgrade
        const existing = await this.getByUser(data.userId);
        const isUpgrade = existing && existing.tier !== data.tier;
        const amount = data.amount || (data.tier === tier_config_1.SubscriptionTier.VIP ? 9 : data.tier === tier_config_1.SubscriptionTier.PRO ? 29 : 0);
        const currency = data.currency || 'usd';
        const sub = {
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
            ? (data.tier === tier_config_1.SubscriptionTier.PRO && existing.tier === tier_config_1.SubscriptionTier.VIP ? 'upgraded' : 'upgraded')
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
        this.logger.log(`[Billing] ${eventType}: user=${data.userId.substring(0, 8)} tier=${data.tier} amount=$${amount} ${currency}`);
        return sub;
    }
    async cancel(userId) {
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
    async expire(userId) {
        const sub = this.subscriptions.find(s => s.userId === userId && s.status === 'active');
        if (sub) {
            sub.status = 'expired';
            this.recordBillingEvent({
                subscriptionId: sub.id,
                userId,
                event: 'expired',
                toTier: tier_config_1.SubscriptionTier.FREE,
                amount: 0,
                currency: sub.currency,
                metadata: { previous_tier: sub.tier, reason: 'subscription_expired' },
            });
            this.logger.log(`[Billing] expired: user=${userId.substring(0, 8)} was ${sub.tier}`);
        }
    }
    getUserTier(userId) {
        const sub = this.subscriptions.find(s => s.userId === userId && s.status === 'active');
        return sub?.tier || tier_config_1.SubscriptionTier.FREE;
    }
    getBillingEvents(userId) {
        if (userId)
            return this.billingEvents.filter(e => e.userId === userId);
        return this.billingEvents;
    }
    getBillingSummary() {
        const active = this.subscriptions.filter(s => s.status === 'active');
        const byTier = {};
        for (const s of active) {
            if (!byTier[s.tier])
                byTier[s.tier] = { count: 0, mrr: 0 };
            byTier[s.tier].count++;
            byTier[s.tier].mrr += s.amount;
        }
        const eventsByType = {};
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
    getPricing() {
        return [
            {
                tier: tier_config_1.SubscriptionTier.FREE,
                name: 'Free',
                price: '免费',
                features: ['每日 3 次 AI 分析', '基础赛事信息', '关键球员名称'],
                cta: '当前方案',
                highlighted: false,
            },
            {
                tier: tier_config_1.SubscriptionTier.VIP,
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
                tier: tier_config_1.SubscriptionTier.PRO,
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
    recordBillingEvent(params) {
        const event = {
            id: `bevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            ...params,
            timestamp: new Date(),
        };
        this.billingEvents.push(event);
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)()
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map