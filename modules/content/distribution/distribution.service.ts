import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentOutput } from '../entities/content-output.entity';
import { ContentTask, ContentStatus } from '../entities/content-task.entity';

interface PublishRecord {
  outputId: string;
  platform: string;
  publishedUrl?: string;
  publishedAt: Date;
  status: 'published' | 'failed';
  error?: string;
}

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(
    @InjectRepository(ContentOutput)
    private readonly outputRepo: Repository<ContentOutput>,
    @InjectRepository(ContentTask)
    private readonly taskRepo: Repository<ContentTask>,
  ) {}

  /**
   * Mark a content output as published on a platform.
   * This is called manually after the operator publishes the content.
   * Phase 3 MVP: Manual publish. Phase 4: API-based auto-publish.
   */
  async recordPublish(record: PublishRecord): Promise<void> {
    await this.outputRepo.update(record.outputId, {
      published_at: record.publishedAt,
      published_url: record.publishedUrl,
    });

    // Check if all outputs for the task are published
    const output = await this.outputRepo.findOne({
      where: { id: record.outputId },
      relations: ['task'],
    });

    if (output?.task_id) {
      const allOutputs = await this.outputRepo.find({
        where: { task_id: output.task_id },
      });
      const allPublished = allOutputs.every(o => o.published_at != null || o.id === record.outputId);
      if (allPublished && allOutputs.length > 0) {
        await this.taskRepo.update(output.task_id, { status: ContentStatus.PUBLISHED });
        this.logger.log(`[Distribution] Task ${output.task_id} fully published`);
      }
    }
  }

  /**
   * Get pending content ready for manual publishing.
   */
  async getPendingOutputs(platform?: string): Promise<ContentOutput[]> {
    const where: any = { published_at: null as any };
    if (platform) where.platform = platform;
    return this.outputRepo.find({ where, order: { generated_at: 'DESC' }, take: 50 });
  }

  /**
   * Get content performance across platforms.
   */
  async getContentPerformance(days = 7): Promise<{
    total_outputs: number;
    published: number;
    by_platform: Record<string, { total: number; published: number; total_engagement: number }>;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const outputs = await this.outputRepo
      .createQueryBuilder('output')
      .where('output.generated_at >= :since', { since })
      .getMany();

    const byPlatform: Record<string, any> = {};
    for (const o of outputs) {
      if (!byPlatform[o.platform]) {
        byPlatform[o.platform] = { total: 0, published: 0, total_engagement: 0 };
      }
      byPlatform[o.platform].total++;
      if (o.published_at) {
        byPlatform[o.platform].published++;
        const engagement = o.engagement || {};
        byPlatform[o.platform].total_engagement +=
          (engagement.views || 0) + (engagement.likes || 0) * 2 + (engagement.shares || 0) * 5;
      }
    }

    return {
      total_outputs: outputs.length,
      published: outputs.filter(o => o.published_at).length,
      by_platform: byPlatform,
    };
  }
}
