import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionTier } from '../../modules/users/subscriptions/tier-config';
export declare const REQUIRED_TIER_KEY = "requiredTier";
export declare const ACTION_TYPE_KEY = "actionType";
export declare enum AiActionType {
    ANALYSIS = "ai_analysis_request",
    CHAT = "ai_chat_message",
    PREDICTION = "ai_prediction_request"
}
/**
 * SubscriptionGuard — enforces tier-based access control.
 *
 * Usage:
 *   @RequireTier(SubscriptionTier.VIP)
 *   @AiAction(AiActionType.ANALYSIS)
 */
export declare class SubscriptionGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private getDailyUsageFromRequest;
}
export declare const RequireTier: (tier: SubscriptionTier) => any;
export declare const AiAction: (action: AiActionType) => any;
//# sourceMappingURL=subscription.guard.d.ts.map