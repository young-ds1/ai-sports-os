import { PredictionService } from '../../../../modules/ai-engine/prediction/prediction.service';
export declare class AiPredictionController {
    private readonly predictionService;
    constructor(predictionService: PredictionService);
    getPrediction(matchId: string): Promise<{
        data: null;
        message: string;
        confidence?: undefined;
    } | {
        data: Record<string, any>;
        confidence: number;
        message?: undefined;
    }>;
    verifyPrediction(matchId: string, body: {
        actualResult: string;
    }): Promise<{
        data: {
            total: number;
            correct: number;
            accuracy: number;
        };
    }>;
    getAccuracyStats(): Promise<{
        data: {
            totalVerified: number;
            totalCorrect: number;
            overallAccuracy: number;
            byModel: Record<string, {
                verified: number;
                correct: number;
                accuracy: number;
            }>;
        };
    }>;
    getUnverified(): Promise<{
        data: import("@modules/ai-engine/prediction/prediction.entity").AiPrediction[];
    }>;
}
//# sourceMappingURL=ai-prediction.controller.d.ts.map