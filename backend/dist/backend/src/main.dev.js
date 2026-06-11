"use strict";
// Dev bootstrap: SQLite + in-memory cache + no external deps
// Production: main.ts with PostgreSQL + Redis + BullMQ
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const core_2 = require("@nestjs/core");
// Import all entities
const sport_entity_1 = require("../../modules/domain/sports/sport.entity");
const competition_entity_1 = require("../../modules/domain/competitions/competition.entity");
const season_entity_1 = require("../../modules/domain/seasons/season.entity");
const team_entity_1 = require("../../modules/domain/teams/team.entity");
const team_season_entity_1 = require("../../modules/domain/teams/team-season.entity");
const player_entity_1 = require("../../modules/domain/players/player.entity");
const match_entity_1 = require("../../modules/domain/matches/match.entity");
const match_event_entity_1 = require("../../modules/domain/matches/match-event.entity");
const user_entity_1 = require("../../modules/users/user.entity");
const user_usage_entity_1 = require("../../modules/users/user-usage.entity");
const user_session_entity_1 = require("../../modules/users/user-session.entity");
const analysis_entity_1 = require("../../modules/ai-engine/analysis/analysis.entity");
const prediction_entity_1 = require("../../modules/ai-engine/prediction/prediction.entity");
const chat_session_entity_1 = require("../../modules/ai-engine/chat/chat-session.entity");
const chat_message_entity_1 = require("../../modules/ai-engine/chat/chat-message.entity");
const content_task_entity_1 = require("../../modules/content/entities/content-task.entity");
const content_output_entity_1 = require("../../modules/content/entities/content-output.entity");
// Import all services
const competitions_service_1 = require("../../modules/domain/competitions/competitions.service");
const matches_service_1 = require("../../modules/domain/matches/matches.service");
const teams_service_1 = require("../../modules/domain/teams/teams.service");
const players_service_1 = require("../../modules/domain/players/players.service");
const match_events_service_1 = require("../../modules/domain/matches/match-events.service");
const openai_service_1 = require("../../modules/ai-engine/engines/openai.service");
const prompt_builder_service_1 = require("../../modules/ai-engine/engines/prompt-builder.service");
const source_tracer_service_1 = require("../../modules/ai-engine/engines/source-tracer.service");
const chat_agent_service_1 = require("../../modules/ai-engine/chat/chat-agent.service");
const ai_cache_service_1 = require("../../modules/ai-engine/cache/ai-cache.service");
const analysis_service_1 = require("../../modules/ai-engine/analysis/analysis.service");
const prediction_service_1 = require("../../modules/ai-engine/prediction/prediction.service");
const chat_service_1 = require("../../modules/ai-engine/chat/chat.service");
const cost_tracker_service_1 = require("../../modules/ai-engine/cost/cost-tracker.service");
const users_service_1 = require("../../modules/users/users.service");
const user_usage_service_1 = require("../../modules/users/user-usage.service");
const subscriptions_service_1 = require("../../modules/subscriptions/subscriptions.service");
const paywall_trigger_service_1 = require("../../modules/subscriptions/paywall-trigger.service");
const tiered_response_service_1 = require("../../modules/subscriptions/tiered-response.service");
const ab_test_service_1 = require("../../modules/subscriptions/ab-test.service");
const preview_teaser_service_1 = require("../../modules/subscriptions/preview-teaser.service");
const observability_service_1 = require("../../modules/users/observability/observability.service");
const market_validation_service_1 = require("../../modules/users/market-validation.service");
const growth_dashboard_service_1 = require("../../modules/users/growth-dashboard.service");
const traffic_engine_service_1 = require("../../modules/users/traffic-engine.service");
const user_quality_service_1 = require("../../modules/users/user-quality.service");
const icp_validation_service_1 = require("../../modules/users/icp-validation.service");
const flywheel_design_service_1 = require("../../modules/users/flywheel-design.service");
// Import controllers
const health_controller_1 = require("./api/controllers/health.controller");
const competition_controller_1 = require("./api/controllers/competition.controller");
const match_controller_1 = require("./api/controllers/match.controller");
const team_controller_1 = require("./api/controllers/team.controller");
const player_controller_1 = require("./api/controllers/player.controller");
const ai_analysis_controller_1 = require("./api/controllers/ai-analysis.controller");
const ai_chat_controller_1 = require("./api/controllers/ai-chat.controller");
const ai_prediction_controller_1 = require("./api/controllers/ai-prediction.controller");
const user_controller_1 = require("./api/controllers/user.controller");
const analytics_controller_1 = require("./api/controllers/analytics.controller");
const market_validation_controller_1 = require("./api/controllers/market-validation.controller");
const transform_interceptor_1 = require("../../shared/interceptors/transform.interceptor");
const usage_tracker_interceptor_1 = require("../../shared/interceptors/usage-tracker.interceptor");
const ALL_ENTITIES = [
    sport_entity_1.Sport, competition_entity_1.Competition, season_entity_1.Season, team_entity_1.Team, team_season_entity_1.TeamSeason, player_entity_1.Player, match_entity_1.Match, match_event_entity_1.MatchEvent,
    user_entity_1.User, user_usage_entity_1.UserUsage, user_session_entity_1.UserSession,
    analysis_entity_1.AiAnalysis, prediction_entity_1.AiPrediction, chat_session_entity_1.ChatSession, chat_message_entity_1.ChatMessage,
    content_task_entity_1.ContentTask, content_output_entity_1.ContentOutput,
];
const ALL_CONTROLLERS = [
    health_controller_1.HealthController, competition_controller_1.CompetitionController, match_controller_1.MatchController, team_controller_1.TeamController,
    player_controller_1.PlayerController, ai_analysis_controller_1.AiAnalysisController, ai_chat_controller_1.AiChatController, ai_prediction_controller_1.AiPredictionController,
    user_controller_1.UserController, analytics_controller_1.AnalyticsController, market_validation_controller_1.MarketValidationController,
];
const ALL_SERVICES = [
    competitions_service_1.CompetitionsService, matches_service_1.MatchesService, teams_service_1.TeamsService, players_service_1.PlayersService, match_events_service_1.MatchEventsService,
    openai_service_1.OpenaiService, prompt_builder_service_1.PromptBuilderService, source_tracer_service_1.SourceTracerService, chat_agent_service_1.ChatAgentService,
    ai_cache_service_1.AiCacheService, analysis_service_1.AnalysisService, prediction_service_1.PredictionService, chat_service_1.ChatService, cost_tracker_service_1.CostTrackerService,
    users_service_1.UsersService, user_usage_service_1.UserUsageService,
    subscriptions_service_1.SubscriptionsService, paywall_trigger_service_1.PaywallTriggerService, tiered_response_service_1.TieredResponseService,
    ab_test_service_1.ABTestService, preview_teaser_service_1.PreviewTeaserService, observability_service_1.ObservabilityService, market_validation_service_1.MarketValidationService, growth_dashboard_service_1.GrowthDashboardService, traffic_engine_service_1.TrafficEngineService, user_quality_service_1.UserQualityService, icp_validation_service_1.ICPValidationService, flywheel_design_service_1.FlywheelDesignService,
];
let DevAppModule = class DevAppModule {
};
DevAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'better-sqlite3',
                database: 'dev.db',
                entities: ALL_ENTITIES,
                synchronize: true,
            }),
            typeorm_1.TypeOrmModule.forFeature(ALL_ENTITIES),
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
        ],
        controllers: ALL_CONTROLLERS,
        providers: [
            ...ALL_SERVICES,
            { provide: core_2.APP_INTERCEPTOR, useClass: usage_tracker_interceptor_1.UsageTrackerInterceptor },
            { provide: core_2.APP_INTERCEPTOR, useClass: transform_interceptor_1.TransformInterceptor },
        ],
    })
], DevAppModule);
async function bootstrap() {
    const app = await core_1.NestFactory.create(DevAppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`⚽ AI Sports OS backend: http://localhost:${port}`);
    logger.log(`📊 Health: http://localhost:${port}/api/health`);
    logger.log(`💾 Database: SQLite (dev.db)`);
    // Auto-seed if database is empty
    try {
        const { DataSource } = await Promise.resolve().then(() => __importStar(require('typeorm')));
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
            }
            else {
                logger.log(`✅ Database already has ${existing[0]?.c || 0} matches`);
            }
        }
        else {
            logger.warn('DataSource not available, skipping seed');
        }
    }
    catch (err) {
        logger.warn(`Seed error (may already have data): ${err.message}`);
    }
}
bootstrap();
//# sourceMappingURL=main.dev.js.map