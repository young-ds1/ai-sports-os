import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { DomainModule } from '../../modules/domain/domain.module';
import { IngestionModule } from '../../modules/ingestion/ingestion.module';
import { AiEngineModule } from '../../modules/ai-engine/ai-engine.module';
import { UsersModule } from '../../modules/users/users.module';
import { ContentModule } from '../../modules/content/content.module';
import { SubscriptionsModule } from '../../modules/subscriptions/subscriptions.module';
import { RevenueModule } from '../../modules/revenue/revenue.module';
import { AutonomousModule } from '../../modules/autonomous/autonomous.module';
import { VCIntelligenceModule } from '../../modules/vc-intelligence/vc-intelligence.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    InfrastructureModule,
    DomainModule,
    IngestionModule,
    AiEngineModule,
    UsersModule,
    ContentModule,        // Growth & Content Engine (STEP 7-8)
    SubscriptionsModule,  // Monetization (STEP 9-10)
    RevenueModule,        // Retention & Revenue Flywheel (STEP 11)
    AutonomousModule,     // Autonomous AI Sports Company (STEP 12)
    VCIntelligenceModule, // VC-Ready System Spec (STEP 13)
    ApiModule,
  ],
})
export class AppModule {}
