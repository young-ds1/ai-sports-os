import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserUsageService } from '../../modules/users/user-usage.service';
/**
 * UsageTrackerInterceptor — fires AFTER the controller succeeds.
 * Records the usage event non-blockingly.
 *
 * Dev mode: Infers action from request path (no middleware needed).
 * Prod mode: Uses middleware-set pendingUsageTrack for full context.
 */
export declare class UsageTrackerInterceptor implements NestInterceptor {
    private readonly userUsageService;
    constructor(userUsageService: UserUsageService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private inferAction;
    private extractEntityId;
}
//# sourceMappingURL=usage-tracker.interceptor.d.ts.map