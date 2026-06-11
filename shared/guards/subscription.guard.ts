import {
  Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getTierConfig, SubscriptionTier } from '../../modules/users/subscriptions/tier-config';

export const REQUIRED_TIER_KEY = 'requiredTier';
export const ACTION_TYPE_KEY = 'actionType';

export enum AiActionType {
  ANALYSIS = 'ai_analysis_request',
  CHAT = 'ai_chat_message',
  PREDICTION = 'ai_prediction_request',
}

/**
 * SubscriptionGuard — enforces tier-based access control.
 *
 * Usage:
 *   @RequireTier(SubscriptionTier.VIP)
 *   @AiAction(AiActionType.ANALYSIS)
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier>(REQUIRED_TIER_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    const actionType = this.reflector.getAllAndOverride<AiActionType>(ACTION_TYPE_KEY, [
      context.getHandler(), context.getClass(),
    ]);

    if (!actionType) return true; // No AI action → allow

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tier = user?.tier || SubscriptionTier.FREE;
    const config = getTierConfig(tier);

    // Check tier requirement
    if (requiredTier && tier !== requiredTier && tier !== SubscriptionTier.PRO) {
      const tierOrder = [SubscriptionTier.FREE, SubscriptionTier.VIP, SubscriptionTier.PRO];
      const userLevel = tierOrder.indexOf(tier as SubscriptionTier);
      const requiredLevel = tierOrder.indexOf(requiredTier);
      if (userLevel < requiredLevel) {
        throw new HttpException(
          { error: 'Subscription upgrade required', required_tier: requiredTier, current_tier: tier },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    // Check daily limits based on action type
    const dailyUsed = this.getDailyUsageFromRequest(request, actionType);
    const dailyLimit = actionType === AiActionType.ANALYSIS
      ? config.daily_ai_analyses
      : config.daily_chat_messages;

    if (dailyUsed >= dailyLimit) {
      throw new HttpException(
        {
          error: 'Daily limit reached',
          action: actionType,
          used: dailyUsed,
          limit: dailyLimit,
          tier,
          upgrade_url: '/user/upgrade',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Attach to request for downstream use
    request.subscriptionContext = {
      tier,
      actionType,
      dailyUsed,
      dailyLimit,
      remaining: dailyLimit - dailyUsed,
      config,
    };

    return true;
  }

  private getDailyUsageFromRequest(request: any, actionType: AiActionType): number {
    // Usage count is injected by the UsageLimitMiddleware in the request pipeline.
    // If not available, default to 0 (pessimistic for prod, but avoids double-counting).
    const usageMap = request.usageContext?.todayUsage || {};
    return usageMap[actionType] || 0;
  }
}

// Decorator helpers
import { SetMetadata } from '@nestjs/common';
export const RequireTier = (tier: SubscriptionTier) => SetMetadata(REQUIRED_TIER_KEY, tier);
export const AiAction = (action: AiActionType) => SetMetadata(ACTION_TYPE_KEY, action);
