import { Module } from '@nestjs/common';
import { RevenueModule } from '../revenue/revenue.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ContentModule } from '../content/content.module';
import { AutonomousModule } from '../autonomous/autonomous.module';
import { UsersModule } from '../users/users.module';
import { MoatMetricsService } from './moat-metrics.service';
import { VCDashboardService } from './vc-dashboard.service';
import { VCIntelligenceController } from './vc-intelligence.controller';

@Module({
  imports: [RevenueModule, SubscriptionsModule, ContentModule, AutonomousModule, UsersModule],
  controllers: [VCIntelligenceController],
  providers: [MoatMetricsService, VCDashboardService],
  exports: [VCDashboardService],
})
export class VCIntelligenceModule {}
