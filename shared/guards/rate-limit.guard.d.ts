import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    private windows;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private ensureWindow;
    private minuteKey;
    private hourKey;
    private cleanup;
}
//# sourceMappingURL=rate-limit.guard.d.ts.map