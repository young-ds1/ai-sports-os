import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from '../../../../modules/users/users.service';
import { UserUsageService } from '../../../../modules/users/user-usage.service';
import { Public } from '../../../../shared/decorators/public.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';

@Controller('api/user')
export class UserController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userUsageService: UserUsageService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    if (!user?.id) return { error: 'Not authenticated' };
    const profile = await this.usersService.findBySupabaseUid(user.id);
    return { data: profile };
  }

  @Get('usage')
  async getUsage(@CurrentUser() user: any) {
    if (!user?.id) return { error: 'Not authenticated' };
    const todayUsage = await this.userUsageService.getTodayUsage(user.id);
    const remaining = await this.usersService.getTodayRemainingUsage(user.id);
    return { data: { today_used: todayUsage, remaining: Math.max(0, remaining - todayUsage), limit: remaining } };
  }
}
