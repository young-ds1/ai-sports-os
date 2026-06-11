import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DomainModule } from '../domain/domain.module';
import { ProviderRouterService } from './router/provider-router.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { MatchSyncService } from './sync/match-sync.service';

@Module({
  imports: [ScheduleModule.forRoot(), DomainModule],
  providers: [ProviderRouterService, SchedulerService, MatchSyncService],
  exports: [ProviderRouterService],
})
export class IngestionModule {}
