export declare enum SubscriptionTier {
    FREE = "free",
    VIP = "vip",
    PRO = "pro"
}
export interface TierLimits {
    tier: SubscriptionTier;
    daily_ai_analyses: number;
    daily_chat_messages: number;
    chat_sessions_per_day: number;
    rate_limit_per_minute: number;
    rate_limit_per_hour: number;
    cache_ttl_seconds: number;
    supports_api_access: boolean;
    supports_content_export: boolean;
    cost_multiplier: number;
}
export declare const TIER_CONFIG: Record<SubscriptionTier, TierLimits>;
export declare const AI_COST_CONFIG: {
    'gpt-4o': {
        input: number;
        output: number;
    };
    'gpt-4o-mini': {
        input: number;
        output: number;
    };
    'gpt-3.5-turbo': {
        input: number;
        output: number;
    };
    default: {
        input: number;
        output: number;
    };
};
export declare function getTierConfig(tier: string): TierLimits;
export declare function getCostPerToken(model: string): {
    input: number;
    output: number;
};
//# sourceMappingURL=tier-config.d.ts.map