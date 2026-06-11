import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const IS_PUBLIC_KEY = "isPublic";
export declare class AuthGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private extractToken;
}
//# sourceMappingURL=auth.guard.d.ts.map