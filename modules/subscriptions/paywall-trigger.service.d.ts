/**
 * PaywallTriggerService — detects when a user is asking a "decision-value" question.
 *
 * These are the moments when a Free user is most likely to convert:
 * - Asking for predictions ("谁会赢", "predict", "比分预测")
 * - Asking for tactical depth ("战术", "阵型", "打法")
 * - High-frequency usage (3+ questions in one session)
 * - Viewing key knockout matches
 * - v2: ≥2 AI analysis views (user is actively researching a match)
 *
 * Strategy: Don't block — tease. Show them what Pro would unlock.
 */
export interface PaywallTrigger {
    triggered: boolean;
    reason: string;
    category: 'prediction' | 'tactics' | 'high_usage' | 'key_match';
    previewSnippet: string;
    upgradeUrl: string;
    conversionPriority: number;
}
export declare class PaywallTriggerService {
    private readonly logger;
    /**
     * Analyze a user message for conversion potential.
     * Returns a trigger if the user is asking a premium-value question.
     */
    analyze(message: string, context: {
        userTier: string;
        consecutiveQuestions: number;
        matchStage?: string;
        matchName?: string;
        aiAnalysisViews?: number;
    }): PaywallTrigger | null;
    /**
     * Generate a preview snippet to show below the AI response.
     * This is the "teaser" — tells the user what Pro would have given them.
     */
    private generatePredictionPreview;
    private generateTacticsPreview;
    private generateHighUsagePreview;
    private generateKeyMatchPreview;
    private generateAnalysisThresholdPreview;
}
//# sourceMappingURL=paywall-trigger.service.d.ts.map