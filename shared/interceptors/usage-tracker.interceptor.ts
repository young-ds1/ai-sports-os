import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserUsageService } from '../../modules/users/user-usage.service';

/**
 * UsageTrackerInterceptor — fires AFTER the controller succeeds.
 * Records the usage event non-blockingly.
 *
 * Dev mode: Infers action from request path (no middleware needed).
 * Prod mode: Uses middleware-set pendingUsageTrack for full context.
 */
@Injectable()
export class UsageTrackerInterceptor implements NestInterceptor {
  constructor(private readonly userUsageService: UserUsageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path: string = request.path || request.url || '';

    return next.handle().pipe(
      tap({
        next: () => {
          // Priority: middleware-set track object
          const track = (request as any).pendingUsageTrack;
          if (track && track.userId !== 'anonymous') {
            this.userUsageService.track({
              userId: track.userId,
              action: track.action,
              entityType: track.entityType,
              entityId: track.entityId,
              latencyMs: track.latency,
            }).catch(() => {});
            return;
          }

          // Fallback (dev mode): infer from path
          const action = this.inferAction(path);
          if (!action) return;

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
          }).catch(() => {});
        },
        error: () => {
          // Don't count failed requests
        },
      }),
    );
  }

  private inferAction(path: string): string | null {
    if (path.includes('/api/ai/analysis')) return 'ai_analysis_request';
    if (path.includes('/api/ai/chat') && !path.includes('history')) return 'ai_chat_message';
    if (path.includes('/api/matches/') && !path.includes('/analysis')) return 'view_match';
    return null;
  }

  private extractEntityId(path: string): string {
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
}
