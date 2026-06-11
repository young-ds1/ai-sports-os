interface ConversionSignal {
    userId: string;
    type: 'upgrade_click' | 'pricing_view' | 'feature_preview_click' | 'subscription_start' | 'subscription_cancel';
    feature?: string;
    source?: string;
    timestamp: Date;
}
interface MonetizationDashboard {
    period: {
        start: string;
        end: string;
    };
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
export declare class MonetizationAnalyticsService {
    private readonly logger;
    private signals;
    trackSignal(signal: Omit<ConversionSignal, 'timestamp'>): void;
    getDashboard(): MonetizationDashboard;
}
export {};
//# sourceMappingURL=monetization-analytics.service.d.ts.map