import { Repository } from 'typeorm';
import { ContentOutput } from '../entities/content-output.entity';
import { ContentTask } from '../entities/content-task.entity';
interface PublishRecord {
    outputId: string;
    platform: string;
    publishedUrl?: string;
    publishedAt: Date;
    status: 'published' | 'failed';
    error?: string;
}
export declare class DistributionService {
    private readonly outputRepo;
    private readonly taskRepo;
    private readonly logger;
    constructor(outputRepo: Repository<ContentOutput>, taskRepo: Repository<ContentTask>);
    /**
     * Mark a content output as published on a platform.
     * This is called manually after the operator publishes the content.
     * Phase 3 MVP: Manual publish. Phase 4: API-based auto-publish.
     */
    recordPublish(record: PublishRecord): Promise<void>;
    /**
     * Get pending content ready for manual publishing.
     */
    getPendingOutputs(platform?: string): Promise<ContentOutput[]>;
    /**
     * Get content performance across platforms.
     */
    getContentPerformance(days?: number): Promise<{
        total_outputs: number;
        published: number;
        by_platform: Record<string, {
            total: number;
            published: number;
            total_engagement: number;
        }>;
    }>;
}
export {};
//# sourceMappingURL=distribution.service.d.ts.map