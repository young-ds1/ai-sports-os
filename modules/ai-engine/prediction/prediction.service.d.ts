import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiPrediction } from './prediction.entity';
export declare class PredictionService {
    private readonly predictionRepo;
    private readonly eventEmitter;
    private readonly logger;
    constructor(predictionRepo: Repository<AiPrediction>, eventEmitter: EventEmitter2);
    getByMatch(matchId: string): Promise<AiPrediction | null>;
    create(data: Partial<AiPrediction>): Promise<AiPrediction>;
    verifyResult(matchId: string, actualResult: string): Promise<{
        total: number;
        correct: number;
        accuracy: number;
    }>;
    /**
     * Get prediction accuracy stats for the feedback loop.
     */
    getAccuracyStats(): Promise<{
        totalVerified: number;
        totalCorrect: number;
        overallAccuracy: number;
        byModel: Record<string, {
            verified: number;
            correct: number;
            accuracy: number;
        }>;
    }>;
    /**
     * Get all unverified predictions that need feedback.
     */
    getUnverified(): Promise<AiPrediction[]>;
}
//# sourceMappingURL=prediction.service.d.ts.map