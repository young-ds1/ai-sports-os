"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiCacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_config_1 = require("../../../infrastructure/redis/redis.config");
let AiCacheService = AiCacheService_1 = class AiCacheService {
    logger = new common_1.Logger(AiCacheService_1.name);
    redis;
    constructor() {
        try {
            this.redis = new ioredis_1.default(redis_config_1.redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
        }
        catch {
            this.logger.warn('Redis not available — AI cache disabled');
        }
    }
    async get(key) {
        if (!this.redis)
            return null;
        try {
            return await this.redis.get(`ai:${key}`);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds = 86400) {
        if (!this.redis)
            return;
        try {
            await this.redis.set(`ai:${key}`, value, 'EX', ttlSeconds);
        }
        catch {
            // Fail silently — cache is optional
        }
    }
    async del(key) {
        if (!this.redis)
            return;
        try {
            await this.redis.del(`ai:${key}`);
        }
        catch {
            // Fail silently
        }
    }
    async getAnalysis(matchId) {
        const cached = await this.get(`analysis:${matchId}`);
        return cached ? JSON.parse(cached) : null;
    }
    async setAnalysis(matchId, data, ttlSeconds = 86400) {
        await this.set(`analysis:${matchId}`, JSON.stringify(data), ttlSeconds);
    }
};
exports.AiCacheService = AiCacheService;
exports.AiCacheService = AiCacheService = AiCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiCacheService);
//# sourceMappingURL=ai-cache.service.js.map