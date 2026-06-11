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
var AiRequestMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRequestMiddleware = void 0;
const common_1 = require("@nestjs/common");
const user_usage_service_1 = require("../../../../modules/users/user-usage.service");
/**
 * AiRequestMiddleware — enforces the Cost Control pipeline BEFORE controllers execute.
 *
 * Pipeline order:
 *   1. Extract user identity (from JWT or IP)
 *   2. Check Redis cache (if applicable — controller handles this)
 *   3. Query today's usage (injects into request.usageContext)
 *   4. Rate Limit Guard fires next
 *   5. Subscription Guard fires next
 *   6. Controller executes (with cache → DB → LLM logic)
 */
let AiRequestMiddleware = AiRequestMiddleware_1 = class AiRequestMiddleware {
    userUsageService;
    logger = new common_1.Logger(AiRequestMiddleware_1.name);
    constructor(userUsageService) {
        this.userUsageService = userUsageService;
    }
    async use(req, res, next) {
        const startTime = Date.now();
        // 1. Extract user identity
        const user = req.user;
        const userId = user?.id || 'anonymous';
        // 2. Pre-fetch today's usage (to avoid duplicate DB calls in guards)
        try {
            const todayUsage = userId !== 'anonymous'
                ? await this.userUsageService.getTodayUsageBreakdown(userId)
                : { ai_analysis_request: 0, ai_chat_message: 0, ai_prediction_request: 0 };
            req.usageContext = { todayUsage, userId };
        }
        catch {
            // Usage check failure should not block the request
            req.usageContext = {
                todayUsage: { ai_analysis_request: 0, ai_chat_message: 0, ai_prediction_request: 0 },
                userId,
            };
        }
        // 3. Track response
        const originalEnd = res.end;
        res.end = function (...args) {
            const latency = Date.now() - startTime;
            req.requestLatency = latency;
            // Log AI requests for observability
            const path = req.path;
            if (path.includes('/ai/')) {
                const action = path.includes('analysis') ? 'ai_analysis_request'
                    : path.includes('chat') ? 'ai_chat_message'
                        : path.includes('prediction') ? 'ai_prediction_request'
                            : 'ai_unknown';
                // Fire-and-forget usage tracking (non-blocking)
                if (userId !== 'anonymous') {
                    const entityId = req.params?.matchId || req.params?.id || '';
                    const entityType = path.includes('analysis') ? 'match'
                        : path.includes('chat') ? 'chat'
                            : 'unknown';
                    // Deferred tracking — see usage-tracker.interceptor
                    req.pendingUsageTrack = { userId, action, entityType, entityId, latency };
                }
            }
            return originalEnd.apply(res, args);
        };
        next();
    }
};
exports.AiRequestMiddleware = AiRequestMiddleware;
exports.AiRequestMiddleware = AiRequestMiddleware = AiRequestMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_usage_service_1.UserUsageService])
], AiRequestMiddleware);
//# sourceMappingURL=ai-request.middleware.js.map