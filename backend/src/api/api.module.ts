import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DomainModule } from '../../../modules/domain/domain.module';
import { AiEngineModule } from '../../../modules/ai-engine/ai-engine.module';
import { UsersModule } from '../../../modules/users/users.module';
import { SubscriptionsModule } from '../../../modules/subscriptions/subscriptions.module';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { RateLimitGuard } from '../../../shared/guards/rate-limit.guard';
import { SubscriptionGuard } from '../../../shared/guards/subscription.guard';
import { TransformInterceptor } from '../../../shared/interceptors/transform.interceptor';
import { UsageTrackerInterceptor } from '../../../shared/interceptors/usage-tracker.interceptor';
import { AiRequestMiddleware } from './middleware/ai-request.middleware';

// Controllers
import { HealthController } from './controllers/health.controller';
import { CompetitionController } from './controllers/competition.controller';
import { MatchController } from './controllers/match.controller';
import { TeamController } from './controllers/team.controller';
import { PlayerController } from './controllers/player.controller';
import { AiAnalysisHardenedController } from './controllers/ai-analysis.hardened.controller';
import { AiChatController } from './controllers/ai-chat.controller';
import { AiPredictionController } from './controllers/ai-prediction.controller';
import { UserController } from './controllers/user.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { MatchResultsController } from './controllers/match-results.controller';
import { MatchResultsService } from './controllers/match-results.service';

const CONTROLLERS = [
  HealthController,
  CompetitionController,
  MatchController,
  TeamController,
  PlayerController,
  AiAnalysisHardenedController, // Hardened with Cost Control pipeline
  AiChatController,
  AiPredictionController,
  UserController,
  AnalyticsController, // Admin analytics dashboard
  MatchResultsController,
];

const GUARDS = [
  AuthGuard,
  RateLimitGuard,
  SubscriptionGuard,
];

const INTERCEPTORS = [
  UsageTrackerInterceptor,
  TransformInterceptor,
];

@Module({
  imports: [DomainModule, AiEngineModule, UsersModule, SubscriptionsModule],
  controllers: CONTROLLERS,
  providers: [
    // Guards
    ...GUARDS,
    { provide: APP_GUARD, useExisting: AuthGuard },
    // Interceptors
    ...INTERCEPTORS,
    { provide: APP_INTERCEPTOR, useExisting: TransformInterceptor }, // Last = wraps response
    { provide: APP_INTERCEPTOR, useExisting: UsageTrackerInterceptor },
    // Middleware
    AiRequestMiddleware,
    // Services
    MatchResultsService,
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply AI request pipeline middleware to all AI endpoints
    consumer
      .apply(AiRequestMiddleware)
      .forRoutes('api/ai/(.*)');
  }
}
