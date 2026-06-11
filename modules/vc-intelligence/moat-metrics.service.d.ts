/**
 * MoatMetricsService — measures and quantifies AI Sports OS's 3 competitive moats.
 *
 * These aren't slides. Each moat is backed by real data flowing through the system.
 * The moat strength score (0-100) is calculated from live metrics.
 */
export interface MoatAssessment {
    moats: MoatHealth[];
    overallMoatScore: number;
    defensibilityRating: string;
    dataAccumulationRate: number;
    switchingCostEstimate: string;
}
export interface MoatHealth {
    name: string;
    description: string;
    score: number;
    trend: 'strengthening' | 'stable' | 'weakening';
    keyMetric: string;
    metricValue: string;
    evidence: string[];
    vcNarrative: string;
}
export declare class MoatMetricsService {
    /**
     * Full moat assessment backed by live system metrics.
     */
    assess(metrics: {
        totalMatches: number;
        totalEvents: number;
        totalAiAnalyses: number;
        totalChatMessages: number;
        totalContentPieces: number;
        totalUsers: number;
        payingUsers: number;
        dau: number;
        d7Retention: number | null;
        aiRequestsPerDau: number;
        predictionsVerified: number;
        predictionsCorrect: number;
        hookPatternsLearned: number;
        abTestCycles: number;
    }): MoatAssessment;
    /**
     * Moat 1: Real-time Event Graph
     *
     * Every match, event, player action is ingested, normalized, and linked.
     * The graph grows denser with each game — making it increasingly
     * expensive for competitors to replicate.
     */
    private assessEventGraph;
    /**
     * Moat 2: Behavioral Data Flywheel
     *
     * Every user question, analysis view, and conversion signal feeds back
     * into better content, better predictions, and better retention.
     * This is a data network effect — more users → better AI → more users.
     */
    private assessBehavioralFlywheel;
    /**
     * Moat 3: Adaptive AI Prediction Engine
     *
     * Predictions are verified against actual results. Incorrect predictions
     * feed back to improve the model. This is self-improving prediction accuracy
     * that gets better with every match.
     */
    private assessAdaptivePrediction;
    private estimateSwitchingCost;
}
//# sourceMappingURL=moat-metrics.service.d.ts.map