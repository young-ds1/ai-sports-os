import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainModule } from '../domain/domain.module';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { UsersModule } from '../users/users.module';
import { ContentTask } from './entities/content-task.entity';
import { ContentOutput } from './entities/content-output.entity';
import { ContentService } from './content.service';
import { SignalService } from './signals/signal.service';
import { HotScoreService } from './signals/hot-score.service';
import { SignalRankerService } from './signals/signal-ranker.service';
import { ContentFactoryService } from './factory/content-factory.service';
import { ContentExplosionService } from './factory/content-explosion.service';
import { HookOptimizerService } from './factory/hook-optimizer.service';
import { ContentController } from './content.controller';
import { XhsAdapter } from './adapters/xiaohongshu.adapter';
import { TwitterAdapter } from './adapters/twitter.adapter';
import { WechatAdapter } from './adapters/wechat.adapter';
import { DouyinAdapter } from './adapters/douyin.adapter';
import { SeoAdapter } from './adapters/seo.adapter';
import { UtmBuilderService } from './distribution/utm-builder.service';
import { DistributionService } from './distribution/distribution.service';
import { EngagementTrackerService } from './feedback/engagement-tracker.service';
import { GrowthAnalyticsService } from './feedback/growth-analytics.service';
import { GrowthFeedbackService } from './feedback/growth-feedback.service';

const CONTENT_ENTITIES = [ContentTask, ContentOutput];
const CONTENT_SERVICES = [
  // Core
  ContentService,
  // Signal Layer (v2 — ranked)
  HotScoreService, SignalRankerService, SignalService,
  // Content Generation
  ContentFactoryService, ContentExplosionService, HookOptimizerService,
  // Platform Adapters
  XhsAdapter, TwitterAdapter, WechatAdapter, DouyinAdapter, SeoAdapter,
  // Distribution
  UtmBuilderService, DistributionService,
  // Feedback & Growth
  EngagementTrackerService, GrowthAnalyticsService, GrowthFeedbackService,
];

@Module({
  imports: [
    TypeOrmModule.forFeature(CONTENT_ENTITIES),
    EventEmitterModule.forRoot(),
    DomainModule,
    AiEngineModule,
    UsersModule,
  ],
  controllers: [ContentController],
  providers: CONTENT_SERVICES,
  exports: [
    ContentService, ContentFactoryService, ContentExplosionService,
    DistributionService, GrowthAnalyticsService, GrowthFeedbackService,
    SignalRankerService, HookOptimizerService,
  ],
})
export class ContentModule {}
