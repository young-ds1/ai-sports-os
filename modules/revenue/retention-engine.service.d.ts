interface CohortMetrics {
    cohort: string;
    size: number;
    d1: number;
    d7: number;
    d30: number;
    avgActionsPerUser: number;
}
interface ChurnRiskUser {
    userId: string;
    riskScore: number;
    riskFactors: string[];
    lastActive: string;
    tier: string;
    recommendedAction: string;
}
export declare class RetentionEngineService {
    private readonly logger;
    private users;
    private dailyActiveUsers;
    /**
     * Record a user session. Call on any page view or AI action.
     */
    recordSession(userId: string, tier: string, action?: string): void;
    /**
     * Get DAU count.
     */
    getDau(date?: string): number;
    /**
     * Calculate cohort retention.
     */
    getCohortRetention(cohortDate?: string): CohortMetrics;
    /**
     * Identify users at risk of churning.
     */
    getChurnRiskUsers(limit?: number): ChurnRiskUser[];
    /**
     * Get retention overview dashboard.
     */
    getOverview(): {
        dau: number;
        d7Retention: number | null;
        d30Retention: number | null;
        totalTrackedUsers: number;
        churnRiskCount: number;
        healthyPercent: number;
    };
    private recommendAction;
}
export {};
//# sourceMappingURL=retention-engine.service.d.ts.map