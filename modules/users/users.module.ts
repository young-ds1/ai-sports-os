import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserUsage } from './user-usage.entity';
import { UserSession } from './user-session.entity';
import { UsersService } from './users.service';
import { UserUsageService } from './user-usage.service';
import { ObservabilityService } from './observability/observability.service';
import { AiEngineModule } from '../ai-engine/ai-engine.module';

const USER_ENTITIES = [User, UserUsage, UserSession];

@Module({
  imports: [TypeOrmModule.forFeature(USER_ENTITIES), AiEngineModule],
  providers: [UsersService, UserUsageService, ObservabilityService],
  exports: [TypeOrmModule, UsersService, UserUsageService, ObservabilityService],
})
export class UsersModule {}
