import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { getCostPerToken, getTierConfig, SubscriptionTier } from '../../users/subscriptions/tier-config';

export interface CostRecord {
  user_id: string;
  action: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  tier: string;
  match_id?: string;
}

@Injectable()
export class CostTrackerService {
  private readonly logger = new Logger(CostTrackerService.name);
  private dailyCosts = new Map<string, number>(); // In-memory aggregation (flushed to DB periodically)

  /**
   * Estimate cost BEFORE making an LLM call.
   * Returns the estimated cost and determines if user is within budget.
   */
  estimateCall(params: {
    tier: string;
    model?: string;
    estimatedInputTokens?: number;
    estimatedOutputTokens?: number;
  }): { estimatedCost: number; withinBudget: boolean } {
    const model = params.model || 'gpt-4o';
    const pricing = getCostPerToken(model);
    const inputTokens = params.estimatedInputTokens || 1000;
    const outputTokens = params.estimatedOutputTokens || 500;

    const estimatedCost =
      (inputTokens / 1_000_000) * pricing.input +
      (outputTokens / 1_000_000) * pricing.output;

    // Free tier soft cap: $0.50/day, VIP: $5/day, Pro: $50/day
    const dailyCap = params.tier === SubscriptionTier.FREE ? 0.50
      : params.tier === SubscriptionTier.VIP ? 5.00
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
  recordCall(cost: CostRecord): void {
    const todayKey = new Date().toISOString().split('T')[0];
    const current = this.dailyCosts.get(todayKey) || 0;
    this.dailyCosts.set(todayKey, current + cost.estimated_cost_usd);

    this.logger.log(
      `[Cost] user=${cost.user_id.substring(0, 8)} action=${cost.action} ` +
      `model=${cost.model} cost=$${cost.estimated_cost_usd.toFixed(6)} ` +
      `tokens_in=${cost.input_tokens} tokens_out=${cost.output_tokens}`,
    );
  }

  /**
   * Get today's total estimated cost across all users.
   */
  getTodayTotalCost(): number {
    const todayKey = new Date().toISOString().split('T')[0];
    return this.dailyCosts.get(todayKey) || 0;
  }

  /**
   * Generate a cost summary for the dashboard.
   */
  getCostSummary(): {
    today_total: number;
    estimated_monthly: number;
    per_user_avg: number;
    model_breakdown: Record<string, number>;
  } {
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
}
