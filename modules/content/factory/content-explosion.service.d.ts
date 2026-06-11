import { Repository } from 'typeorm';
import { ContentTask } from '../entities/content-task.entity';
import { ContentOutput } from '../entities/content-output.entity';
import { OpenaiService } from '../../ai-engine/engines/openai.service';
import { PromptBuilderService } from '../../ai-engine/engines/prompt-builder.service';
import { CostTrackerService } from '../../ai-engine/cost/cost-tracker.service';
import { MatchesService } from '../../domain/matches/matches.service';
import { XhsAdapter } from '../adapters/xiaohongshu.adapter';
import { TwitterAdapter } from '../adapters/twitter.adapter';
import { WechatAdapter } from '../adapters/wechat.adapter';
import { DouyinAdapter } from '../adapters/douyin.adapter';
import { SeoAdapter } from '../adapters/seo.adapter';
import { UtmBuilderService } from '../distribution/utm-builder.service';
import { HookOptimizerService } from './hook-optimizer.service';
import { ExplosiveSignal } from '../signals/signal-ranker.service';
export declare class ContentExplosionService {
    private readonly taskRepo;
    private readonly outputRepo;
    private readonly openai;
    private readonly promptBuilder;
    private readonly costTracker;
    private readonly matchesService;
    private readonly utmBuilder;
    private readonly hookOptimizer;
    private readonly logger;
    private platformAdapters;
    constructor(taskRepo: Repository<ContentTask>, outputRepo: Repository<ContentOutput>, openai: OpenaiService, promptBuilder: PromptBuilderService, costTracker: CostTrackerService, matchesService: MatchesService, utmBuilder: UtmBuilderService, hookOptimizer: HookOptimizerService, xhsAdapter: XhsAdapter, twitterAdapter: TwitterAdapter, wechatAdapter: WechatAdapter, douyinAdapter: DouyinAdapter, seoAdapter: SeoAdapter);
    /**
     * Listen for explosive signals from the SignalRanker.
     * One signal → explosion across all 5 platforms in parallel.
     */
    onExplosiveSignal(signal: ExplosiveSignal): Promise<void>;
    /**
     * Create the master content task for this explosion.
     */
    private createExplosionTask;
    /**
     * Map explosion signal to content type.
     * Nuclear tier gets multiple content types.
     */
    private mapSignalToContentType;
    /**
     * Generate AI content with hook optimization.
     * The prompt is enhanced by:
     * - HotScore reason (why this match matters)
     * - Best-performing hook patterns from feedback data
     */
    private generateContent;
    /**
     * Explode content to all 5 platforms in parallel.
     * Each platform gets its own optimized version.
     */
    private explodeToPlatforms;
}
//# sourceMappingURL=content-explosion.service.d.ts.map