"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAction = exports.RequireTier = exports.SubscriptionGuard = exports.AiActionType = exports.ACTION_TYPE_KEY = exports.REQUIRED_TIER_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const tier_config_1 = require("../../modules/users/subscriptions/tier-config");
exports.REQUIRED_TIER_KEY = 'requiredTier';
exports.ACTION_TYPE_KEY = 'actionType';
var AiActionType;
(function (AiActionType) {
    AiActionType["ANALYSIS"] = "ai_analysis_request";
    AiActionType["CHAT"] = "ai_chat_message";
    AiActionType["PREDICTION"] = "ai_prediction_request";
})(AiActionType || (exports.AiActionType = AiActionType = {}));
/**
 * SubscriptionGuard — enforces tier-based access control.
 *
 * Usage:
 *   @RequireTier(SubscriptionTier.VIP)
 *   @AiAction(AiActionType.ANALYSIS)
 */
let SubscriptionGuard = class SubscriptionGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredTier = this.reflector.getAllAndOverride(exports.REQUIRED_TIER_KEY, [
            context.getHandler(), context.getClass(),
        ]);
        const actionType = this.reflector.getAllAndOverride(exports.ACTION_TYPE_KEY, [
            context.getHandler(), context.getClass(),
        ]);
        if (!actionType)
            return true; // No AI action → allow
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tier = user?.tier || tier_config_1.SubscriptionTier.FREE;
        const config = (0, tier_config_1.getTierConfig)(tier);
        // Check tier requirement
        if (requiredTier && tier !== requiredTier && tier !== tier_config_1.SubscriptionTier.PRO) {
            const tierOrder = [tier_config_1.SubscriptionTier.FREE, tier_config_1.SubscriptionTier.VIP, tier_config_1.SubscriptionTier.PRO];
            const userLevel = tierOrder.indexOf(tier);
            const requiredLevel = tierOrder.indexOf(requiredTier);
            if (userLevel < requiredLevel) {
                throw new common_1.HttpException({ error: 'Subscription upgrade required', required_tier: requiredTier, current_tier: tier }, common_1.HttpStatus.PAYMENT_REQUIRED);
            }
        }
        // Check daily limits based on action type
        const dailyUsed = this.getDailyUsageFromRequest(request, actionType);
        const dailyLimit = actionType === AiActionType.ANALYSIS
            ? config.daily_ai_analyses
            : config.daily_chat_messages;
        if (dailyUsed >= dailyLimit) {
            throw new common_1.HttpException({
                error: 'Daily limit reached',
                action: actionType,
                used: dailyUsed,
                limit: dailyLimit,
                tier,
                upgrade_url: '/user/upgrade',
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
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
    getDailyUsageFromRequest(request, actionType) {
        // Usage count is injected by the UsageLimitMiddleware in the request pipeline.
        // If not available, default to 0 (pessimistic for prod, but avoids double-counting).
        const usageMap = request.usageContext?.todayUsage || {};
        return usageMap[actionType] || 0;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], SubscriptionGuard);
// Decorator helpers
const common_2 = require("@nestjs/common");
const RequireTier = (tier) => (0, common_2.SetMetadata)(exports.REQUIRED_TIER_KEY, tier);
exports.RequireTier = RequireTier;
const AiAction = (action) => (0, common_2.SetMetadata)(exports.ACTION_TYPE_KEY, action);
exports.AiAction = AiAction;
//# sourceMappingURL=subscription.guard.js.map