import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentTask, ContentStatus } from './entities/content-task.entity';
import { ContentOutput } from './entities/content-output.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentTask)
    private readonly taskRepo: Repository<ContentTask>,
    @InjectRepository(ContentOutput)
    private readonly outputRepo: Repository<ContentOutput>,
  ) {}

  async getTasks(status?: string, limit = 20): Promise<ContentTask[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.taskRepo.find({ where, order: { created_at: 'DESC' }, take: limit });
  }

  async getOutputs(taskId: string): Promise<ContentOutput[]> {
    return this.outputRepo.find({
      where: { task_id: taskId },
      order: { generated_at: 'DESC' },
    });
  }

  async getLatestOutputs(platform?: string, limit = 20): Promise<ContentOutput[]> {
    const where: any = {};
    if (platform) where.platform = platform;
    return this.outputRepo.find({
      where,
      order: { generated_at: 'DESC' },
      take: limit,
    });
  }

  async retryTask(taskId: string): Promise<void> {
    await this.taskRepo.update(taskId, { status: ContentStatus.PENDING });
  }
}
