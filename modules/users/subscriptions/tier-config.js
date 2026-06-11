"use strict";
// Subscription tier configuration — single source of truth for all limits
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_COST_CONFIG = exports.TIER_CONFIG = exports.SubscriptionTier = void 0;
exports.getTierConfig = getTierConfig;
exports.getCostPerToken = getCostPerToken;
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["FREE"] = "free";
    SubscriptionTier["VIP"] = "vip";
    SubscriptionTier["PRO"] = "pro";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
exports.TIER_CONFIG = {
    [SubscriptionTier.FREE]: {
        tier: SubscriptionTier.FREE,
        daily_ai_analyses: 3,
        daily_chat_messages: 10,
        chat_sessions_per_day: 5,
        rate_limit_per_minute: 5,
        rate_limit_per_hour: 30,
        cache_ttl_seconds: 86400, // 24h
        supports_api_access: false,
        supports_content_export: false,
        cost_multiplier: 1.0,
    },
    [SubscriptionTier.VIP]: {
        tier: SubscriptionTier.VIP,
        daily_ai_analyses: 50,
        daily_chat_messages: 200,
        chat_sessions_per_day: 30,
        rate_limit_per_minute: 15,
        rate_limit_per_hour: 100,
        cache_ttl_seconds: 21600, // 6h — VIP gets fresher analysis
        supports_api_access: false,
        supports_content_export: true,
        cost_multiplier: 1.5,
    },
    [SubscriptionTier.PRO]: {
        tier: SubscriptionTier.PRO,
        daily_ai_analyses: 500,
        daily_chat_messages: 2000,
        chat_sessions_per_day: 100,
        rate_limit_per_minute: 60,
        rate_limit_per_hour: 500,
        cache_ttl_seconds: 3600, // 1h — PRO gets near-real-time
        supports_api_access: true,
        supports_content_export: true,
        cost_multiplier: 2.0,
    },
};
// OpenAI pricing per 1M tokens (June 2026 estimates)
exports.AI_COST_CONFIG = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    default: { input: 2.50, output: 10.00 },
};
function getTierConfig(tier) {
    return exports.TIER_CONFIG[tier] || exports.TIER_CONFIG[SubscriptionTier.FREE];
}
function getCostPerToken(model) {
    return exports.AI_COST_CONFIG[model] || exports.AI_COST_CONFIG.default;
}
//# sourceMappingURL=tier-config.js.map