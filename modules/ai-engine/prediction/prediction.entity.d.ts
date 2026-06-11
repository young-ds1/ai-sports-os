import { Match } from '../../domain/matches/match.entity';
export declare class AiPrediction {
    id: string;
    match: Match;
    match_id: string;
    prediction: Record<string, any>;
    model_version: string;
    input_context: Record<string, any>;
    confidence_score: number;
    tokens_used: number;
    generated_at: Date;
    is_verified: boolean;
    is_correct: boolean;
    actual_result: string;
    created_at: Date;
}
//# sourceMappingURL=prediction.entity.d.ts.map