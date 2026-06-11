import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { redisUrl } from '../../../infrastructure/redis/redis.config';

@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);
  private redis: Redis;

  constructor() {
    try {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
    } catch {
      this.logger.warn('Redis not available — AI cache disabled');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get(`ai:${key}`);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds = 86400): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(`ai:${key}`, value, 'EX', ttlSeconds);
    } catch {
      // Fail silently — cache is optional
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(`ai:${key}`);
    } catch {
      // Fail silently
    }
  }

  async getAnalysis(matchId: string): Promise<Record<string, any> | null> {
    const cached = await this.get(`analysis:${matchId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setAnalysis(matchId: string, data: Record<string, any>, ttlSeconds = 86400): Promise<void> {
    await this.set(`analysis:${matchId}`, JSON.stringify(data), ttlSeconds);
  }
}
