import { UsersService } from '../../../../modules/users/users.service';
import { UserUsageService } from '../../../../modules/users/user-usage.service';
export declare class UserController {
    private readonly usersService;
    private readonly userUsageService;
    constructor(usersService: UsersService, userUsageService: UserUsageService);
    getProfile(user: any): Promise<{
        error: string;
        data?: undefined;
    } | {
        data: import("@modules/users/user.entity").User | null;
        error?: undefined;
    }>;
    getUsage(user: any): Promise<{
        error: string;
        data?: undefined;
    } | {
        data: {
            today_used: number;
            remaining: number;
            limit: number;
        };
        error?: undefined;
    }>;
}
//# sourceMappingURL=user.controller.d.ts.map