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
export declare class CostTrackerService {
    private readonly logger;
    private dailyCosts;
    /**
     * Estimate cost BEFORE making an LLM call.
     * Returns the estimated cost and determines if user is within budget.
     */
    estimateCall(params: {
        tier: string;
        model?: string;
        estimatedInputTokens?: number;
        estimatedOutputTokens?: number;
    }): {
        estimatedCost: number;
        withinBudget: boolean;
    };
    /**
     * Record actual cost AFTER an LLM call completes.
     */
    recordCall(cost: CostRecord): void;
    /**
     * Get today's total estimated cost across all users.
     */
    getTodayTotalCost(): number;
    /**
     * Generate a cost summary for the dashboard.
     */
    getCostSummary(): {
        today_total: number;
        estimated_monthly: number;
        per_user_avg: number;
        model_breakdown: Record<string, number>;
    };
}
//# sourceMappingURL=cost-tracker.service.d.ts.map