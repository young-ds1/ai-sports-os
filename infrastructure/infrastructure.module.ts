import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { redisConfig } from './redis/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL', 'postgresql://app:password@localhost:5432/ai_sports_os'),
        autoLoadEntities: true,
        synchronize: false, // Use migrations only
        logging: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        connection: redisConfig,
      }),
    }),
  ],
  exports: [TypeOrmModule, BullModule],
})
export class InfrastructureModule {}
