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
interface CreateTaskParams {
    trigger_type: string;
    reference_type: string;
    reference_id: string;
    content_type: string;
    target_platforms: string[];
    priority: number;
    input_context: Record<string, any>;
}
export declare class ContentFactoryService {
    private readonly taskRepo;
    private readonly outputRepo;
    private readonly openai;
    private readonly promptBuilder;
    private readonly costTracker;
    private readonly matchesService;
    private readonly utmBuilder;
    private readonly xhsAdapter;
    private readonly twitterAdapter;
    private readonly wechatAdapter;
    private readonly douyinAdapter;
    private readonly seoAdapter;
    private readonly logger;
    private platformAdapters;
    constructor(taskRepo: Repository<ContentTask>, outputRepo: Repository<ContentOutput>, openai: OpenaiService, promptBuilder: PromptBuilderService, costTracker: CostTrackerService, matchesService: MatchesService, utmBuilder: UtmBuilderService, xhsAdapter: XhsAdapter, twitterAdapter: TwitterAdapter, wechatAdapter: WechatAdapter, douyinAdapter: DouyinAdapter, seoAdapter: SeoAdapter);
    createTask(params: CreateTaskParams): Promise<ContentTask>;
    generateForTask(task: ContentTask): Promise<void>;
    private buildContentPrompt;
    private buildUserPrompt;
}
export {};
//# sourceMappingURL=content-factory.service.d.ts.map