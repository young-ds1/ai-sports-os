"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisUrl = exports.redisConfig = void 0;
exports.redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: 3,
};
exports.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
//# sourceMappingURL=redis.config.js.map