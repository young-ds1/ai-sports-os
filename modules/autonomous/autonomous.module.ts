import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DomainModule } from '../domain/domain.module';
import { ContentModule } from '../content/content.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { RevenueModule } from '../revenue/revenue.module';
import { StrategyAgentService } from './agents/strategy-agent.service';
import { ContentAgentService } from './agents/content-agent.service';
import { DistributionAgentService } from './agents/distribution-agent.service';
import { GrowthAgentService } from './agents/growth-agent.service';
import { MonetizationAgentService } from './agents/monetization-agent.service';
import { AutonomousLoopService } from './autonomous-loop.service';
import { AutonomousController } from './autonomous.controller';

const AGENTS = [
  StrategyAgentService, ContentAgentService, DistributionAgentService,
  GrowthAgentService, MonetizationAgentService,
];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DomainModule, ContentModule, SubscriptionsModule, RevenueModule,
  ],
  controllers: [AutonomousController],
  providers: [AutonomousLoopService, ...AGENTS],
  exports: [AutonomousLoopService],
})
export class AutonomousModule {}
