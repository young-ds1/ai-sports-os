/**
 * TieredResponseService — the core of monetization.
 *
 * Free users get "decision-ready but incomplete" analysis.
 * They see the VALUE of AI analysis, but the BEST parts are locked.
 *
 * This is NOT a hard paywall — it's a "value gradient":
 *   Free  → Shows WHAT happened (data summary)
 *   Pro   → Explains WHY it happened (tactical breakdown)
 *   Elite → Predicts what WILL happen (simulations, trends)
 */
export interface TieredPrompt {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
    features: string[];
    lockedFeatures: string[];
}
export interface TieredAnalysis {
    common: {
        summary: string;
        recent_form: string;
        key_player_names: string[];
    };
    pro?: {
        tactical_breakdown: string;
        player_performance_scores: Record<string, number>;
        win_probability: {
            home: number;
            draw: number;
            away: number;
        };
        confidence_index: number;
        upset_risk: string;
    };
    elite?: {
        simulations: string;
        group_advancement_odds: string;
        trend_analysis: string;
        lineup_optimization: string;
    };
    meta: {
        tier: string;
        features_unlocked: string[];
        features_locked: string[];
        upgrade_cta?: string;
    };
}
export declare class TieredResponseService {
    /**
     * Build prompt parameters based on user tier.
     * Free gets basic analysis. Pro/Elite get exponentially more depth.
     */
    getPromptConfig(tier: string, questionType: string): TieredPrompt;
    /**
     * Post-process AI output to add/remove layers based on tier.
     * Free users see a "preview" of locked sections.
     */
    tierify(rawOutput: string, tier: string): TieredAnalysis;
    private freeSystemPrompt;
    private proSystemPrompt;
    private eliteSystemPrompt;
    private extractCommon;
    private extractPro;
    private extractElite;
    private extractPlayerNames;
}
//# sourceMappingURL=tiered-response.service.d.ts.map