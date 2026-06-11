/**
 * ABTestService — splits Free users into control/variant groups
 * to measure whether Pro previews actually increase conversion.
 *
 * Groups:
 *   A (control)  — Standard Free experience, no upgrade prompts
 *   B (variant)  — Sees Pro preview teasers after premium questions
 *   C (variant2) — Sees preview BEFORE answering (aggressive upsell)
 *
 * Assignment: deterministic hash of user_id → consistent across sessions.
 */
export type TestGroup = 'A' | 'B' | 'C';
interface ExperimentConfig {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    groups: Record<TestGroup, {
        weight: number;
        showTeasers: boolean;
        teaserTiming: 'after' | 'before' | 'never';
        freeLimitMultiplier: number;
    }>;
}
interface TestResult {
    experimentId: string;
    group: TestGroup;
    totalUsers: number;
    conversions: number;
    conversionRate: number;
    avgQuestionsPerUser: number;
    avgSessionsPerUser: number;
}
export declare class ABTestService {
    private readonly logger;
    private readonly activeExperiment;
    private conversionData;
    /**
     * Assign a user to an experiment group.
     * Deterministic — same user always gets same group.
     */
    assignGroup(userId: string): TestGroup;
    /**
     * Check if teasers should be shown to this user.
     */
    shouldShowTeasers(userId: string): {
        show: boolean;
        timing: 'after' | 'before' | 'never';
    };
    /**
     * Get the effective free limit multiplier for this user.
     */
    getFreeLimitMultiplier(userId: string): number;
    /**
     * Track a user action for the experiment.
     */
    trackAction(userId: string, action: 'question' | 'session'): void;
    /**
     * Track a conversion (user upgrades from Free).
     */
    trackConversion(userId: string): void;
    /**
     * Get experiment results.
     */
    getResults(): {
        experiment: ExperimentConfig;
        results: TestResult[];
    };
    private hashString;
}
export {};
//# sourceMappingURL=ab-test.service.d.ts.map