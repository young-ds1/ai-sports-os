import { Repository } from 'typeorm';
import { UserUsage } from './user-usage.entity';
export declare class UserUsageService {
    private readonly usageRepo;
    constructor(usageRepo: Repository<UserUsage>);
    track(data: {
        userId: string;
        action: string;
        entityType?: string;
        entityId?: string;
        sessionId?: string;
        latencyMs?: number;
    }): Promise<UserUsage>;
    getTodayUsage(userId: string): Promise<number>;
    getTodayUsageBreakdown(userId: string): Promise<Record<string, number>>;
    getTopMatches(limit?: number, date?: string): Promise<Array<{
        entity_id: string;
        views: number;
    }>>;
    getDailyActiveUsers(date?: string): Promise<number>;
    getAiRequestsPerDau(date?: string): Promise<number>;
}
//# sourceMappingURL=user-usage.service.d.ts.map