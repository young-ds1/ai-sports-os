import { AnalysisService } from '../../../../modules/ai-engine/analysis/analysis.service';
import { AiCacheService } from '../../../../modules/ai-engine/cache/ai-cache.service';
import { OpenaiService } from '../../../../modules/ai-engine/engines/openai.service';
import { PromptBuilderService } from '../../../../modules/ai-engine/engines/prompt-builder.service';
import { MatchesService } from '../../../../modules/domain/matches/matches.service';
export declare class AiAnalysisController {
    private readonly analysisService;
    private readonly cacheService;
    private readonly openai;
    private readonly promptBuilder;
    private readonly matchesService;
    constructor(analysisService: AnalysisService, cacheService: AiCacheService, openai: OpenaiService, promptBuilder: PromptBuilderService, matchesService: MatchesService);
    getAnalysis(matchId: string): Promise<{
        data: Record<string, any>;
        source: string;
        error?: undefined;
    } | {
        error: string;
        data?: undefined;
        source?: undefined;
    } | {
        data: {
            summary: string;
            generated_at: string;
        };
        source: string;
        error?: undefined;
    }>;
}
//# sourceMappingURL=ai-analysis.controller.d.ts.map