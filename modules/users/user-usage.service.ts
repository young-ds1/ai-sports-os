import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UserUsage } from './user-usage.entity';

@Injectable()
export class UserUsageService {
  constructor(
    @InjectRepository(UserUsage)
    private readonly usageRepo: Repository<UserUsage>,
  ) {}

  async track(data: {
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    sessionId?: string;
    latencyMs?: number;
  }): Promise<UserUsage> {
    const usage = this.usageRepo.create({
      user_id: data.userId,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      session_id: data.sessionId,
      latency_ms: data.latencyMs,
    });
    return this.usageRepo.save(usage);
  }

  async getTodayUsage(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.usageRepo.count({
      where: {
        user_id: userId,
        action: 'ai_analysis_request',
        created_at: Between(today, tomorrow) as any,
      },
    });
  }

  async getTodayUsageBreakdown(userId: string): Promise<Record<string, number>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rows = await this.usageRepo
      .createQueryBuilder('usage')
      .select('usage.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('usage.user_id = :userId', { userId })
      .andWhere('usage.created_at >= :today', { today })
      .andWhere('usage.created_at < :tomorrow', { tomorrow })
      .groupBy('usage.action')
      .getRawMany();

    const breakdown: Record<string, number> = {
      ai_analysis_request: 0,
      ai_chat_message: 0,
      ai_prediction_request: 0,
    };
    for (const row of rows) {
      breakdown[row.action] = parseInt(row.count, 10);
    }
    return breakdown;
  }

  async getTopMatches(limit = 10, date?: string): Promise<Array<{ entity_id: string; views: number }>> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.usageRepo
      .createQueryBuilder('usage')
      .select('usage.entity_id', 'entity_id')
      .addSelect('COUNT(*)', 'views')
      .where('usage.action = :action', { action: 'view_match' })
      .andWhere('date(usage.created_at) = :date', { date: targetDate })
      .groupBy('usage.entity_id')
      .orderBy('views', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getDailyActiveUsers(date?: string): Promise<number> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await this.usageRepo
      .createQueryBuilder('usage')
      .select('COUNT(DISTINCT usage.user_id)', 'count')
      .where('date(usage.created_at) = :date', { date: targetDate })
      .getRawOne();
    return parseInt(result?.count || '0', 10);
  }

  async getAiRequestsPerDau(date?: string): Promise<number> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await this.usageRepo
      .createQueryBuilder('usage')
      .select('CAST(COUNT(*) AS REAL) / MAX(COUNT(DISTINCT usage.user_id), 1)', 'ratio')
      .where('usage.action IN (:...actions)', { actions: ['ai_analysis_request', 'ai_chat_message'] })
      .andWhere('date(usage.created_at) = :date', { date: targetDate })
      .getRawOne();

    return result?.ratio || 0;
  }
}
