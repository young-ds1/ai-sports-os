import { AnalysisService } from '../../../../modules/ai-engine/analysis/analysis.service';
import { AiCacheService } from '../../../../modules/ai-engine/cache/ai-cache.service';
import { OpenaiService } from '../../../../modules/ai-engine/engines/openai.service';
import { PromptBuilderService } from '../../../../modules/ai-engine/engines/prompt-builder.service';
import { MatchesService } from '../../../../modules/domain/matches/matches.service';
import { CostTrackerService } from '../../../../modules/ai-engine/cost/cost-tracker.service';
export declare class AiAnalysisHardenedController {
    private readonly analysisService;
    private readonly cacheService;
    private readonly openai;
    private readonly promptBuilder;
    private readonly matchesService;
    private readonly costTracker;
    constructor(analysisService: AnalysisService, cacheService: AiCacheService, openai: OpenaiService, promptBuilder: PromptBuilderService, matchesService: MatchesService, costTracker: CostTrackerService);
    getAnalysis(matchId: string, req: any): Promise<{
        data: Record<string, any>;
        source: string;
        meta: {
            remaining: any;
            limit: any;
            cache_hit: boolean;
            generated_at?: undefined;
            error?: undefined;
            upgrade_url?: undefined;
            estimated_cost?: undefined;
        };
        error?: undefined;
    } | {
        data: Record<string, any>;
        source: string;
        meta: {
            remaining: any;
            limit: any;
            generated_at: Date;
            cache_hit?: undefined;
            error?: undefined;
            upgrade_url?: undefined;
            estimated_cost?: undefined;
        };
        error?: undefined;
    } | {
        data: Record<string, any> | null;
        source: string;
        meta: {
            error: string;
            upgrade_url: string;
            remaining?: undefined;
            limit?: undefined;
            cache_hit?: undefined;
            generated_at?: undefined;
            estimated_cost?: undefined;
        };
        error?: undefined;
    } | {
        error: string;
        data?: undefined;
        source?: undefined;
        meta?: undefined;
    } | {
        data: {
            summary: string;
            generated_at: string;
        };
        source: string;
        meta: {
            remaining: number;
            limit: any;
            estimated_cost: number;
            cache_hit?: undefined;
            generated_at?: undefined;
            error?: undefined;
            upgrade_url?: undefined;
        };
        error?: undefined;
    }>;
}
//# sourceMappingURL=ai-analysis.hardened.controller.d.ts.map