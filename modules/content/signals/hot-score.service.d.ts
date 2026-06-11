/**
 * HotScore dimensions — every match is scored across 4 axes.
 * Only top 10% signals trigger content explosion.
 */
export interface HotScoreInput {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    tournamentStage: string;
    homeScore?: number;
    awayScore?: number;
    status: string;
    elapsedMinute?: number;
    starPlayers: Array<{
        name: string;
        tier: 'goat' | 'superstar' | 'star' | 'notable';
    }>;
    totalGoals?: number;
    goalDiff?: number;
    hasRedCard?: boolean;
    hasComeback?: boolean;
    isExtraTime?: boolean;
    isPenaltyShootout?: boolean;
    lateDramaMinutes?: number;
    externalMentions?: number;
    trendPosition?: number;
}
export interface HotScoreResult {
    matchId: string;
    totalScore: number;
    importanceScore: number;
    starPowerScore: number;
    momentumScore: number;
    buzzScore: number;
    isExplosive: boolean;
    tier: 'nuclear' | 'hot' | 'warm' | 'cold';
    reason: string;
}
export declare class HotScoreService {
    /**
     * Calculate hotness score for a match signal.
     * Formula: importance(30%) + starPower(25%) + momentum(25%) + buzz(20%)
     */
    calculate(input: HotScoreInput): HotScoreResult;
    private scoreImportance;
    private scoreStarPower;
    private scoreMomentum;
    private scoreBuzz;
    private buildReason;
}
//# sourceMappingURL=hot-score.service.d.ts.map