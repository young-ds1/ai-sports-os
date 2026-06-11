import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    findBySupabaseUid(uid: string): Promise<User | null>;
    createOrUpdate(data: Partial<User>): Promise<User>;
    getTodayRemainingUsage(userId: string): Promise<number>;
}
//# sourceMappingURL=users.service.d.ts.map