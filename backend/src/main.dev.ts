// Dev bootstrap: SQLite + in-memory cache + no external deps
// Production: main.ts with PostgreSQL + Redis + BullMQ

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Import all entities
import { Sport } from '../../modules/domain/sports/sport.entity';
import { Competition } from '../../modules/domain/competitions/competition.entity';
import { Season } from '../../modules/domain/seasons/season.entity';
import { Team } from '../../modules/domain/teams/team.entity';
import { TeamSeason } from '../../modules/domain/teams/team-season.entity';
import { Player } from '../../modules/domain/players/player.entity';
import { Match } from '../../modules/domain/matches/match.entity';
import { MatchEvent } from '../../modules/domain/matches/match-event.entity';
import { User } from '../../modules/users/user.entity';
import { UserUsage } from '../../modules/users/user-usage.entity';
import { UserSession } from '../../modules/users/user-session.entity';
import { AiAnalysis } from '../../modules/ai-engine/analysis/analysis.entity';
import { AiPrediction } from '../../modules/ai-engine/prediction/prediction.entity';
import { ChatSession } from '../../modules/ai-engine/chat/chat-session.entity';
import { ChatMessage } from '../../modules/ai-engine/chat/chat-message.entity';
import { ContentTask } from '../../modules/content/entities/content-task.entity';
import { ContentOutput } from '../../modules/content/entities/content-output.entity';

// Import all services
import { CompetitionsService } from '../../modules/domain/competitions/competitions.service';
import { MatchesService } from '../../modules/domain/matches/matches.service';
import { TeamsService } from '../../modules/domain/teams/teams.service';
import { PlayersService } from '../../modules/domain/players/players.service';
import { MatchEventsService } from '../../modules/domain/matches/match-events.service';
import { OpenaiService } from '../../modules/ai-engine/engines/openai.service';
import { PromptBuilderService } from '../../modules/ai-engine/engines/prompt-builder.service';
import { SourceTracerService } from '../../modules/ai-engine/engines/source-tracer.service';
import { ChatAgentService } from '../../modules/ai-engine/chat/chat-agent.service';
import { AiCacheService } from '../../modules/ai-engine/cache/ai-cache.service';
import { AnalysisService } from '../../modules/ai-engine/analysis/analysis.service';
import { PredictionService } from '../../modules/ai-engine/prediction/prediction.service';
import { ChatService } from '../../modules/ai-engine/chat/chat.service';
import { CostTrackerService } from '../../modules/ai-engine/cost/cost-tracker.service';
import { UsersService } from '../../modules/users/users.service';
import { UserUsageService } from '../../modules/users/user-usage.service';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import { PaywallTriggerService } from '../../modules/subscriptions/paywall-trigger.service';
import { TieredResponseService } from '../../modules/subscriptions/tiered-response.service';
import { ABTestService } from '../../modules/subscriptions/ab-test.service';
import { PreviewTeaserService } from '../../modules/subscriptions/preview-teaser.service';
import { ObservabilityService } from '../../modules/users/observability/observability.service';
import { MarketValidationService } from '../../modules/users/market-validation.service';
import { GrowthDashboardService } from '../../modules/users/growth-dashboard.service';
import { TrafficEngineService } from '../../modules/users/traffic-engine.service';
import { UserQualityService } from '../../modules/users/user-quality.service';
import { ICPValidationService } from '../../modules/users/icp-validation.service';
import { FlywheelDesignService } from '../../modules/users/flywheel-design.service';

// Import controllers
import { HealthController } from './api/controllers/health.controller';
import { CompetitionController } from './api/controllers/competition.controller';
import { MatchController } from './api/controllers/match.controller';
import { TeamController } from './api/controllers/team.controller';
import { PlayerController } from './api/controllers/player.controller';
import { AiAnalysisController } from './api/controllers/ai-analysis.controller';
import { AiChatController } from './api/controllers/ai-chat.controller';
import { AiPredictionController } from './api/controllers/ai-prediction.controller';
import { UserController } from './api/controllers/user.controller';
import { AnalyticsController } from './api/controllers/analytics.controller';
import { MarketValidationController } from './api/controllers/market-validation.controller';

import { TransformInterceptor } from '../../shared/interceptors/transform.interceptor';
import { UsageTrackerInterceptor } from '../../shared/interceptors/usage-tracker.interceptor';

const ALL_ENTITIES = [
  Sport, Competition, Season, Team, TeamSeason, Player, Match, MatchEvent,
  User, UserUsage, UserSession,
  AiAnalysis, AiPrediction, ChatSession, ChatMessage,
  ContentTask, ContentOutput,
];

const ALL_CONTROLLERS = [
  HealthController, CompetitionController, MatchController, TeamController,
  PlayerController, AiAnalysisController, AiChatController, AiPredictionController,
  UserController, AnalyticsController, MarketValidationController,
];

const ALL_SERVICES = [
  CompetitionsService, MatchesService, TeamsService, PlayersService, MatchEventsService,
  OpenaiService, PromptBuilderService, SourceTracerService, ChatAgentService,
  AiCacheService, AnalysisService, PredictionService, ChatService, CostTrackerService,
  UsersService, UserUsageService,
  SubscriptionsService, PaywallTriggerService, TieredResponseService,
  ABTestService, PreviewTeaserService, ObservabilityService, MarketValidationService, GrowthDashboardService, TrafficEngineService, UserQualityService, ICPValidationService, FlywheelDesignService,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'dev.db',
      entities: ALL_ENTITIES,
      synchronize: true,
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: ALL_CONTROLLERS,
  providers: [
    ...ALL_SERVICES,
    { provide: APP_INTERCEPTOR, useClass: UsageTrackerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
class DevAppModule {}

async function bootstrap() {
  const app = await NestFactory.create(DevAppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`⚽ AI Sports OS backend: http://localhost:${port}`);
  logger.log(`📊 Health: http://localhost:${port}/api/health`);
  logger.log(`💾 Database: SQLite (dev.db)`);

  // Auto-seed if database is empty
  try {
    const { DataSource } = await import('typeorm');
    const dataSource = app.get(DataSource);

    if (dataSource) {
      const qr = dataSource.createQueryRunner();
      const existing = await qr.query('SELECT COUNT(*) as c FROM matches');
      if (existing[0]?.c === 0 || !existing.length) {
        logger.log('🌱 Seeding via raw SQL...');

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        await qr.query(`INSERT OR IGNORE INTO sports (id, name, name_zh, slug, icon) VALUES ('sport-football', 'football', '足球', 'football', '⚽')`);
        await qr.query(`INSERT OR IGNORE INTO competitions (id, sport_id, provider, provider_id, name, name_zh, type) VALUES ('comp-worldcup-2026', 'sport-football', 'api-football', 1, 'FIFA World Cup', '2026世界杯', 'tournament')`);
        await qr.query(`INSERT OR IGNORE INTO seasons (id, competition_id, name, start_date, end_date, is_current, provider) VALUES ('season-wc2026', 'comp-worldcup-2026', '2026', '2026-06-12', '2026-07-19', 1, 'api-football')`);

        const teams = [
          ['team-arg', 'api-football', 10, 'Argentina', '阿根廷', 'ARG', 'Argentina', 'ARG', 'national', 'Lionel Scaloni'],
          ['team-bra', 'api-football', 11, 'Brazil', '巴西', 'BRA', 'Brazil', 'BRA', 'national', 'Dorival Júnior'],
          ['team-fra', 'api-football', 12, 'France', '法国', 'FRA', 'France', 'FRA', 'national', 'Didier Deschamps'],
          ['team-eng', 'api-football', 13, 'England', '英格兰', 'ENG', 'England', 'ENG', 'national', 'Thomas Tuchel'],
          ['team-ger', 'api-football', 14, 'Germany', '德国', 'GER', 'Germany', 'GER', 'national', 'Julian Nagelsmann'],
          ['team-esp', 'api-football', 15, 'Spain', '西班牙', 'ESP', 'Spain', 'ESP', 'national', 'Luis de la Fuente'],
          ['team-por', 'api-football', 16, 'Portugal', '葡萄牙', 'POR', 'Portugal', 'POR', 'national', 'Roberto Martínez'],
          ['team-ned', 'api-football', 17, 'Netherlands', '荷兰', 'NED', 'Netherlands', 'NED', 'national', 'Ronald Koeman'],
        ];
        for (const t of teams) {
          await qr.query(`INSERT OR IGNORE INTO teams (id, provider, provider_id, name, name_zh, short_name, country, country_code, type, coach) VALUES (?,?,?,?,?,?,?,?,?,?)`, t);
        }

        await qr.query(`INSERT OR IGNORE INTO players (id, provider, provider_id, name, position, nationality) VALUES ('player-lionel-messi', 'api-football', 1001, 'Lionel Messi', 'FW', 'Argentina')`);
        await qr.query(`INSERT OR IGNORE INTO players (id, provider, provider_id, name, position, nationality) VALUES ('player-vinicius-jr', 'api-football', 1003, 'Vinicius Jr', 'FW', 'Brazil')`);
        await qr.query(`INSERT OR IGNORE INTO players (id, provider, provider_id, name, position, nationality) VALUES ('player-kylian-mbappe', 'api-football', 1005, 'Kylian Mbappe', 'FW', 'France')`);
        await qr.query(`INSERT OR IGNORE INTO players (id, provider, provider_id, name, position, nationality) VALUES ('player-jamal-musiala', 'api-football', 1007, 'Jamal Musiala', 'MF', 'Germany')`);
        await qr.query(`INSERT OR IGNORE INTO players (id, provider, provider_id, name, position, nationality) VALUES ('player-lamine-yamal', 'api-football', 1008, 'Lamine Yamal', 'FW', 'Spain')`);

        const matches = [
          ['match-001', 'api-football', 1001, 'comp-worldcup-2026', 'season-wc2026', 'team-arg', 'team-bra', today, '20:00:00', 'scheduled', null, null, 'Group Stage · Matchday 1', 'A', 'Estadio Azteca', 'Mexico City'],
          ['match-002', 'api-football', 1002, 'comp-worldcup-2026', 'season-wc2026', 'team-fra', 'team-eng', today, '17:00:00', 'live', 2, 1, 'Group Stage · Matchday 1', 'B', 'MetLife Stadium', 'New Jersey'],
          ['match-003', 'api-football', 1003, 'comp-worldcup-2026', 'season-wc2026', 'team-ger', 'team-esp', yesterday, '20:00:00', 'finished', 3, 3, 'Group Stage · Matchday 1', 'C', 'AT&T Stadium', 'Dallas'],
          ['match-004', 'api-football', 1004, 'comp-worldcup-2026', 'season-wc2026', 'team-por', 'team-ned', tomorrow, '17:00:00', 'scheduled', null, null, 'Group Stage · Matchday 1', 'D', 'SoFi Stadium', 'Los Angeles'],
        ];
        for (const m of matches) {
          await qr.query(`INSERT OR IGNORE INTO matches (id, provider, provider_id, competition_id, season_id, home_team_id, away_team_id, match_date, kickoff_time, status, home_score, away_score, round, group_name, venue, city) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, m);
        }

        // Set HT scores for match-002
        await qr.query(`UPDATE matches SET home_ht_score=1, away_ht_score=0, elapsed_minute=67 WHERE id='match-002'`);
        // Set HT scores for match-003
        await qr.query(`UPDATE matches SET home_ht_score=2, away_ht_score=1 WHERE id='match-003'`);

        // Events for match-003
        const events = [
          ['evt-001', 'match-003', 'player-jamal-musiala', 'team-ger', 'goal', 12, 'Goal by Musiala'],
          ['evt-002', 'match-003', null, 'team-ger', 'goal', 24, 'Goal by Havertz, penalty'],
          ['evt-003', 'match-003', null, 'team-ger', 'yellow_card', 35, 'Tactical foul by Rudiger'],
          ['evt-004', 'match-003', 'player-lamine-yamal', 'team-esp', 'goal', 41, 'Goal by Yamal'],
          ['evt-005', 'match-003', null, 'team-esp', 'goal', 56, 'Goal by Williams'],
          ['evt-006', 'match-003', null, 'team-esp', 'yellow_card', 64, 'Late tackle by Rodri'],
          ['evt-007', 'match-003', null, 'team-ger', 'goal', 72, 'Goal by Wirtz'],
          ['evt-008', 'match-003', null, 'team-esp', 'goal', 88, 'Equalizer by Pedri'],
        ];
        for (const e of events) {
          await qr.query(`INSERT OR IGNORE INTO match_events (id, match_id, player_id, team_id, type, minute, comment) VALUES (?,?,?,?,?,?,?)`, e);
        }

        await qr.release();
        logger.log(`✅ Seed complete: 1 sport, 1 competition, 1 season, 8 teams, 5 players, 4 matches, 8 events`);
      } else {
        logger.log(`✅ Database already has ${existing[0]?.c || 0} matches`);
      }
    } else {
      logger.warn('DataSource not available, skipping seed');
    }
  } catch (err) {
    logger.warn(`Seed error (may already have data): ${(err as Error).message}`);
  }
}

bootstrap();
