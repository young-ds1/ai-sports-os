import { Match } from '../../domain/matches/match.entity';
export declare class AiAnalysis {
    id: string;
    match: Match;
    match_id: string;
    team_id: string;
    player_id: string;
    analysis_type: string;
    content: Record<string, any>;
    model_version: string;
    input_context: Record<string, any>;
    confidence_score: number;
    tokens_used: number;
    generated_at: Date;
    expires_at: Date;
    is_cached: boolean;
    created_at: Date;
}
//# sourceMappingURL=analysis.entity.d.ts.map