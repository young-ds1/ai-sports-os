import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserUsageService } from '../../../../modules/users/user-usage.service';

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
@Injectable()
export class AiRequestMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AiRequestMiddleware.name);

  constructor(private readonly userUsageService: UserUsageService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // 1. Extract user identity
    const user = (req as any).user;
    const userId = user?.id || 'anonymous';

    // 2. Pre-fetch today's usage (to avoid duplicate DB calls in guards)
    try {
      const todayUsage = userId !== 'anonymous'
        ? await this.userUsageService.getTodayUsageBreakdown(userId)
        : { ai_analysis_request: 0, ai_chat_message: 0, ai_prediction_request: 0 };

      (req as any).usageContext = { todayUsage, userId };
    } catch {
      // Usage check failure should not block the request
      (req as any).usageContext = {
        todayUsage: { ai_analysis_request: 0, ai_chat_message: 0, ai_prediction_request: 0 },
        userId,
      };
    }

    // 3. Track response
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      const latency = Date.now() - startTime;
      (req as any).requestLatency = latency;

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
          (req as any).pendingUsageTrack = { userId, action, entityType, entityId, latency };
        }
      }

      return originalEnd.apply(res, args);
    };

    next();
  }
}
