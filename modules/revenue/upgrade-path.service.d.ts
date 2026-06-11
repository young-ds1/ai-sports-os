/**
 * UpgradePathService — designs the graduated value discovery that
 * leads Free users naturally toward Pro, and Pro to Elite.
 *
 * Psychology: Users don't upgrade because they're told to.
 * They upgrade because they hit a wall where the next tier
 * is OBVIOUSLY worth it.
 *
 * Three upgrade paths:
 * 1. Limit Wall    → "You've used 3/3 analyses. Pro = unlimited."
 * 2. Insight Gap   → "You know WHAT happened. Pro tells you WHY."
 * 3. Decision Need → "关键比赛，别靠猜。Pro 的预测帮你做判断。"
 */
export interface UpgradePathStatus {
    userId: string;
    currentTier: string;
    paths: Array<{
        id: string;
        name: string;
        description: string;
        progress: number;
        triggered: boolean;
        triggerReason: string;
        nextTier: string;
    }>;
    recommendedNextTier: string | null;
    urgencyLevel: 'none' | 'low' | 'medium' | 'high';
}
export declare class UpgradePathService {
    /**
     * Evaluate a user's upgrade readiness across all paths.
     */
    evaluate(userId: string, context: {
        tier: string;
        todayAnalysisCount: number;
        dailyLimit: number;
        consecutiveQuestions: number;
        hasAskedPrediction: boolean;
        hasViewedKeyMatch: boolean;
        streak: number;
    }): UpgradePathStatus;
    private evaluateLimitWall;
    private evaluateInsightGap;
    private evaluateDecisionNeed;
}
//# sourceMappingURL=upgrade-path.service.d.ts.map