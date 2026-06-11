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
export declare class SubscriptionsService {
    private readonly logger;
    private subscriptions;
    billingEvents: BillingEvent[];
    getByUser(userId: string): Promise<SubscriptionRecord | null>;
    create(data: {
        userId: string;
        tier: SubscriptionTier;
        provider?: 'manual' | 'stripe';
        amount?: number;
        currency?: string;
        metadata?: Record<string, string>;
    }): Promise<SubscriptionRecord>;
    cancel(userId: string): Promise<void>;
    expire(userId: string): Promise<void>;
    getUserTier(userId: string): SubscriptionTier;
    getBillingEvents(userId?: string): BillingEvent[];
    getBillingSummary(): {
        totalRevenue: number;
        activeSubscriptions: number;
        byTier: Record<string, {
            count: number;
            mrr: number;
        }>;
        eventsByType: Record<string, number>;
    };
    getPricing(): Array<{
        tier: SubscriptionTier;
        name: string;
        price: string;
        features: string[];
        cta: string;
        highlighted: boolean;
    }>;
    private recordBillingEvent;
}
export {};
//# sourceMappingURL=subscriptions.service.d.ts.map