"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CostTrackerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostTrackerService = void 0;
const common_1 = require("@nestjs/common");
const tier_config_1 = require("../../users/subscriptions/tier-config");
let CostTrackerService = CostTrackerService_1 = class CostTrackerService {
    logger = new common_1.Logger(CostTrackerService_1.name);
    dailyCosts = new Map(); // In-memory aggregation (flushed to DB periodically)
    /**
     * Estimate cost BEFORE making an LLM call.
     * Returns the estimated cost and determines if user is within budget.
     */
    estimateCall(params) {
        const model = params.model || 'gpt-4o';
        const pricing = (0, tier_config_1.getCostPerToken)(model);
        const inputTokens = params.estimatedInputTokens || 1000;
        const outputTokens = params.estimatedOutputTokens || 500;
        const estimatedCost = (inputTokens / 1_000_000) * pricing.input +
            (outputTokens / 1_000_000) * pricing.output;
        // Free tier soft cap: $0.50/day, VIP: $5/day, Pro: $50/day
        const dailyCap = params.tier === tier_config_1.SubscriptionTier.FREE ? 0.50
            : params.tier === tier_config_1.SubscriptionTier.VIP ? 5.00
                : 50.00;
        const todayKey = new Date().toISOString().split('T')[0];
        const spentToday = this.dailyCosts.get(todayKey) || 0;
        return {
            estimatedCost: Math.round(estimatedCost * 10000) / 10000,
            withinBudget: spentToday + estimatedCost <= dailyCap,
        };
    }
    /**
     * Record actual cost AFTER an LLM call completes.
     */
    recordCall(cost) {
        const todayKey = new Date().toISOString().split('T')[0];
        const current = this.dailyCosts.get(todayKey) || 0;
        this.dailyCosts.set(todayKey, current + cost.estimated_cost_usd);
        this.logger.log(`[Cost] user=${cost.user_id.substring(0, 8)} action=${cost.action} ` +
            `model=${cost.model} cost=$${cost.estimated_cost_usd.toFixed(6)} ` +
            `tokens_in=${cost.input_tokens} tokens_out=${cost.output_tokens}`);
    }
    /**
     * Get today's total estimated cost across all users.
     */
    getTodayTotalCost() {
        const todayKey = new Date().toISOString().split('T')[0];
        return this.dailyCosts.get(todayKey) || 0;
    }
    /**
     * Generate a cost summary for the dashboard.
     */
    getCostSummary() {
        const todayTotal = this.getTodayTotalCost();
        const dayOfMonth = new Date().getDate();
        const monthTotal = todayTotal * (30 / Math.max(dayOfMonth, 1));
        return {
            today_total: Math.round(todayTotal * 100) / 100,
            estimated_monthly: Math.round(monthTotal * 100) / 100,
            per_user_avg: 0, // Calculated from user_usage join
            model_breakdown: { 'gpt-4o': todayTotal }, // Simplified
        };
    }
};
exports.CostTrackerService = CostTrackerService;
exports.CostTrackerService = CostTrackerService = CostTrackerService_1 = __decorate([
    (0, common_1.Injectable)()
], CostTrackerService);
//# sourceMappingURL=cost-tracker.service.js.map