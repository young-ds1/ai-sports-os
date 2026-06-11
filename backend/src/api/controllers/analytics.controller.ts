import { Controller, Get, Query } from '@nestjs/common';
import { ObservabilityService } from '../../../../modules/users/observability/observability.service';
import { CostTrackerService } from '../../../../modules/ai-engine/cost/cost-tracker.service';
import { UserUsageService } from '../../../../modules/users/user-usage.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/admin/analytics')
export class AnalyticsController {
  constructor(
    private readonly observability: ObservabilityService,
    private readonly costTracker: CostTrackerService,
    private readonly userUsageService: UserUsageService,
  ) {}

  @Get('dashboard')
  @Public()
  async getDashboard(@Query('date') date?: string) {
    return this.observability.getDashboardSnapshot(date);
  }

  @Get('costs')
  @Public()
  async getCosts() {
    return this.costTracker.getCostSummary();
  }

  @Get('north-star')
  @Public()
  async getNorthStarMetric(@Query('days') days = 7) {
    const results = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const ratio = await this.userUsageService.getAiRequestsPerDau(dateStr);
      const dau = await this.userUsageService.getDailyActiveUsers(dateStr);
      results.push({ date: dateStr, ai_requests_per_dau: Math.round(ratio * 100) / 100, dau });
    }
    return { data: results };
  }

  @Get('top-matches')
  @Public()
  async getTopMatches(@Query('date') date?: string, @Query('limit') limit = 10) {
    return this.userUsageService.getTopMatches(limit, date);
  }
}
