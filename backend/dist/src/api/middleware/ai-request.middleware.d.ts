import { NestMiddleware } from '@nestjs/common';
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
export declare class AiRequestMiddleware implements NestMiddleware {
    private readonly userUsageService;
    private readonly logger;
    constructor(userUsageService: UserUsageService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=ai-request.middleware.d.ts.map