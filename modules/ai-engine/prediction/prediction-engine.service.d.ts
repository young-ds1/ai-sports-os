interface MatchPrediction {
    homeTeam: string;
    awayTeam: string;
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    topScores: Array<{
        score: string;
        prob: number;
    }>;
    upsetProb: number;
    confidence: number;
    explanation: string;
    generatedAt: string;
}
interface TournamentProjection {
    winnerProbs: Array<{
        team: string;
        prob: number;
        flag: string;
    }>;
    groupQualification: Record<string, Array<{
        team: string;
        prob: number;
    }>>;
    goldenBoot: Array<{
        player: string;
        team: string;
        prob: number;
    }>;
}
export declare class PredictionEngineService {
    private readonly logger;
    /**
     * Predict match outcome using Elo difference + form adjustment.
     */
    predictMatch(homeTeam: string, awayTeam: string): MatchPrediction;
    /**
     * World Cup winner probabilities using Elo + tournament structure simulation.
     */
    getTournamentProjection(): TournamentProjection;
    /**
     * Predict all 4 seeded matches.
     */
    predictAllMatches(): MatchPrediction[];
    /**
     * Get prediction accuracy stats.
     */
    getTrackRecord(): {
        total: number;
        correct: number;
        accuracy: number;
        lastUpdated: string;
    };
    private defaultRating;
    private generateScoreProbs;
    private factorial;
    private generateExplanation;
    private getFlag;
}
export {};
//# sourceMappingURL=prediction-engine.service.d.ts.map