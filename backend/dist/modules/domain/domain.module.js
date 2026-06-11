"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sport_entity_1 = require("./sports/sport.entity");
const competition_entity_1 = require("./competitions/competition.entity");
const season_entity_1 = require("./seasons/season.entity");
const team_entity_1 = require("./teams/team.entity");
const team_season_entity_1 = require("./teams/team-season.entity");
const player_entity_1 = require("./players/player.entity");
const match_entity_1 = require("./matches/match.entity");
const match_event_entity_1 = require("./matches/match-event.entity");
const competitions_service_1 = require("./competitions/competitions.service");
const matches_service_1 = require("./matches/matches.service");
const teams_service_1 = require("./teams/teams.service");
const players_service_1 = require("./players/players.service");
const match_events_service_1 = require("./matches/match-events.service");
const ENTITIES = [sport_entity_1.Sport, competition_entity_1.Competition, season_entity_1.Season, team_entity_1.Team, team_season_entity_1.TeamSeason, player_entity_1.Player, match_entity_1.Match, match_event_entity_1.MatchEvent];
const SERVICES = [competitions_service_1.CompetitionsService, matches_service_1.MatchesService, teams_service_1.TeamsService, players_service_1.PlayersService, match_events_service_1.MatchEventsService];
let DomainModule = class DomainModule {
};
exports.DomainModule = DomainModule;
exports.DomainModule = DomainModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature(ENTITIES)],
        providers: SERVICES,
        exports: [typeorm_1.TypeOrmModule, ...SERVICES],
    })
], DomainModule);
//# sourceMappingURL=domain.module.js.map