export interface MatchContext {
    home_team: string;
    away_team: string;
    competition: string;
    match_date: string;
    status: string;
    home_score?: number;
    away_score?: number;
    recentForm?: {
        home: string[];
        away: string[];
    };
    events?: {
        type: string;
        minute: number;
        comment: string;
    }[];
    stats?: Record<string, any>;
    headToHead?: string;
}
export declare class PromptBuilderService {
    buildAnalysisPrompt(context: MatchContext, type: 'pre_match' | 'post_match'): string;
    buildChatPrompt(userMessage: string, dbContext: string): string;
    private buildPreMatchPrompt;
    private buildPostMatchPrompt;
}
//# sourceMappingURL=prompt-builder.service.d.ts.map