import {
  Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getTierConfig, TIER_CONFIG, SubscriptionTier } from '../../modules/users/subscriptions/tier-config';

// Simple in-memory rate limiter (production: use Redis sliding window)
interface RateWindow {
  minute: Map<string, number>;  // key → count
  hour: Map<string, number>;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private windows = new Map<string, RateWindow>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Determine the rate limit key
    const user = request.user;
    const userId = user?.id || 'anonymous';
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const key = userId !== 'anonymous' ? `user:${userId}` : `ip:${ip}`;

    // Get tier config
    const tier = user?.tier || SubscriptionTier.FREE;
    const config = getTierConfig(tier);

    // Check limits
    this.ensureWindow(key);

    const window = this.windows.get(key)!;
    const minuteCount = window.minute.get(this.minuteKey()) || 0;
    const hourCount = window.hour.get(this.hourKey()) || 0;

    if (minuteCount >= config.rate_limit_per_minute) {
      throw new HttpException(
        { error: 'Rate limit exceeded', retry_after_seconds: 60 },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (hourCount >= config.rate_limit_per_hour) {
      throw new HttpException(
        { error: 'Hourly rate limit exceeded', retry_after_seconds: 3600 },
        HttpStatus.TOO_MANY_REQUESTS,
      );
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

  private ensureWindow(key: string): void {
    if (!this.windows.has(key)) {
      this.windows.set(key, { minute: new Map(), hour: new Map() });
    }

    // Cleanup old entries every ~100 requests
    if (Math.random() < 0.01) {
      this.cleanup();
    }
  }

  private minuteKey(): string {
    return Math.floor(Date.now() / 60000).toString();
  }

  private hourKey(): string {
    return Math.floor(Date.now() / 3600000).toString();
  }

  private cleanup(): void {
    const currentMinute = this.minuteKey();
    const currentHour = this.hourKey();

    for (const [, window] of this.windows) {
      for (const key of window.minute.keys()) {
        if (key !== currentMinute) window.minute.delete(key);
      }
      for (const key of window.hour.keys()) {
        if (key !== currentHour) window.hour.delete(key);
      }
    }
  }
}
