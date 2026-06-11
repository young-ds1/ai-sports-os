import { Repository } from 'typeorm';
import { ContentOutput } from '../entities/content-output.entity';
import { HookOptimizerService } from '../factory/hook-optimizer.service';
import { UserUsageService } from '../../users/user-usage.service';
interface ContentPerformanceSnapshot {
    contentId: string;
    platform: string;
    publishedAt: Date;
    ctr: number;
    engagement: number;
    conversions: number;
    daysSincePublish: number;
}
export declare class GrowthFeedbackService {
    private readonly outputRepo;
    private readonly hookOptimizer;
    private readonly userUsageService;
    private readonly logger;
    constructor(outputRepo: Repository<ContentOutput>, hookOptimizer: HookOptimizerService, userUsageService: UserUsageService);
    /**
     * Process feedback batch:
     * 1. Pull all published content
     * 2. Calculate performance metrics
     * 3. Update hook pattern scores
     * 4. Identify winning content formulas
     */
    processFeedbackBatch(daysBack?: number): Promise<{
        analyzed: number;
        topPerformers: ContentPerformanceSnapshot[];
        updatedPatterns: number;
        insights: string[];
    }>;
    /**
     * Infer which hook pattern was used based on content analysis.
     * Simplified: checks first characters for pattern matching.
     */
    private inferPattern;
}
export {};
//# sourceMappingURL=growth-feedback.service.d.ts.map