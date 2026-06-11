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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const tier_config_1 = require("../../modules/users/subscriptions/tier-config");
let RateLimitGuard = class RateLimitGuard {
    reflector;
    windows = new Map();
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        // Determine the rate limit key
        const user = request.user;
        const userId = user?.id || 'anonymous';
        const ip = request.ip || request.connection?.remoteAddress || 'unknown';
        const key = userId !== 'anonymous' ? `user:${userId}` : `ip:${ip}`;
        // Get tier config
        const tier = user?.tier || tier_config_1.SubscriptionTier.FREE;
        const config = (0, tier_config_1.getTierConfig)(tier);
        // Check limits
        this.ensureWindow(key);
        const window = this.windows.get(key);
        const minuteCount = window.minute.get(this.minuteKey()) || 0;
        const hourCount = window.hour.get(this.hourKey()) || 0;
        if (minuteCount >= config.rate_limit_per_minute) {
            throw new common_1.HttpException({ error: 'Rate limit exceeded', retry_after_seconds: 60 }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (hourCount >= config.rate_limit_per_hour) {
            throw new common_1.HttpException({ error: 'Hourly rate limit exceeded', retry_after_seconds: 3600 }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        // Increment counters
        window.minute.set(this.minuteKey(), minuteCount + 1);
        window.hour.set(this.hourKey(), hourCount + 1);
        // Attach rate limit info to response headers
        const response = context.switchToHttp().getResponse();
        response.header('X-RateLimit-Limit-Minute', config.rate_limit_per_minute);
        response.header('X-RateLimit-Remaining-Minute', config.rate_limit_per_minute - minuteCount - 1);
        response.header('X-RateLimit-Tier', tier);
        return true;
    }
    ensureWindow(key) {
        if (!this.windows.has(key)) {
            this.windows.set(key, { minute: new Map(), hour: new Map() });
        }
        // Cleanup old entries every ~100 requests
        if (Math.random() < 0.01) {
            this.cleanup();
        }
    }
    minuteKey() {
        return Math.floor(Date.now() / 60000).toString();
    }
    hourKey() {
        return Math.floor(Date.now() / 3600000).toString();
    }
    cleanup() {
        const currentMinute = this.minuteKey();
        const currentHour = this.hourKey();
        for (const [, window] of this.windows) {
            for (const key of window.minute.keys()) {
                if (key !== currentMinute)
                    window.minute.delete(key);
            }
            for (const key of window.hour.keys()) {
                if (key !== currentHour)
                    window.hour.delete(key);
            }
        }
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map