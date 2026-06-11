export declare class AiCacheService {
    private readonly logger;
    private redis;
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    getAnalysis(matchId: string): Promise<Record<string, any> | null>;
    setAnalysis(matchId: string, data: Record<string, any>, ttlSeconds?: number): Promise<void>;
}
//# sourceMappingURL=ai-cache.service.d.ts.map