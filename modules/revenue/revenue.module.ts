import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DomainModule } from '../domain/domain.module';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StreakTrackerService } from './streak-tracker.service';
import { HabitLoopService } from './habit-loop.service';
import { RetentionEngineService } from './retention-engine.service';
import { UpgradePathService } from './upgrade-path.service';
import { ReengagementService } from './reengagement.service';
import { RevenueFlywheelService } from './revenue-flywheel.service';
import { RevenueController } from './revenue.controller';

const SERVICES = [
  StreakTrackerService, HabitLoopService,
  RetentionEngineService, UpgradePathService,
  ReengagementService, RevenueFlywheelService,
];

@Module({
  imports: [ScheduleModule.forRoot(), DomainModule, AiEngineModule, SubscriptionsModule],
  controllers: [RevenueController],
  providers: SERVICES,
  exports: SERVICES,
})
export class RevenueModule {}
