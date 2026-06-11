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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageTrackerInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const user_usage_service_1 = require("../../modules/users/user-usage.service");
/**
 * UsageTrackerInterceptor — fires AFTER the controller succeeds.
 * Records the usage event non-blockingly.
 *
 * Dev mode: Infers action from request path (no middleware needed).
 * Prod mode: Uses middleware-set pendingUsageTrack for full context.
 */
let UsageTrackerInterceptor = class UsageTrackerInterceptor {
    userUsageService;
    constructor(userUsageService) {
        this.userUsageService = userUsageService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const path = request.path || request.url || '';
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                // Priority: middleware-set track object
                const track = request.pendingUsageTrack;
                if (track && track.userId !== 'anonymous') {
                    this.userUsageService.track({
                        userId: track.userId,
                        action: track.action,
                        entityType: track.entityType,
                        entityId: track.entityId,
                        latencyMs: track.latency,
                    }).catch(() => { });
                    return;
                }
                // Fallback (dev mode): infer from path
                const action = this.inferAction(path);
                if (!action)
                    return;
                const entityId = this.extractEntityId(path);
                const entityType = action === 'view_match' ? 'match'
                    : action === 'ai_analysis_request' ? 'match'
                        : action === 'ai_chat_message' ? 'chat'
                            : 'unknown';
                this.userUsageService.track({
                    userId: 'dev-user',
                    action,
                    entityType,
                    entityId,
                    latencyMs: 0,
                }).catch(() => { });
            },
            error: () => {
                // Don't count failed requests
            },
        }));
    }
    inferAction(path) {
        if (path.includes('/api/ai/analysis'))
            return 'ai_analysis_request';
        if (path.includes('/api/ai/chat') && !path.includes('history'))
            return 'ai_chat_message';
        if (path.includes('/api/matches/') && !path.includes('/analysis'))
            return 'view_match';
        return null;
    }
    extractEntityId(path) {
        const parts = path.split('/');
        // /api/matches/match-003 → match-003
        // /api/ai/analysis/match-003 → match-003
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === 'matches' || parts[i] === 'analysis') {
                return parts[i + 1] || '';
            }
        }
        return '';
    }
};
exports.UsageTrackerInterceptor = UsageTrackerInterceptor;
exports.UsageTrackerInterceptor = UsageTrackerInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_usage_service_1.UserUsageService])
], UsageTrackerInterceptor);
//# sourceMappingURL=usage-tracker.interceptor.js.map