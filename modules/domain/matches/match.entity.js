"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const typeorm_1 = require("typeorm");
const competition_entity_1 = require("../competitions/competition.entity");
const season_entity_1 = require("../seasons/season.entity");
const team_entity_1 = require("../teams/team.entity");
const match_event_entity_1 = require("./match-event.entity");
let Match = class Match {
    id;
    provider;
    provider_id;
    competition;
    competition_id;
    season;
    season_id;
    home_team;
    home_team_id;
    away_team;
    away_team_id;
    // Timeline
    match_date;
    kickoff_time;
    status;
    elapsed_minute;
    // Scores
    home_score;
    away_score;
    home_ht_score;
    away_ht_score;
    home_et_score;
    away_et_score;
    home_penalty;
    away_penalty;
    // Tournament structure
    round;
    group_name;
    knockout_stage;
    // Venue
    venue;
    city;
    attendance;
    referee;
    stats_summary;
    meta;
    events;
    created_at;
    updated_at;
};
exports.Match = Match;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Match.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Match.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], Match.prototype, "provider_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => competition_entity_1.Competition, (c) => c.matches, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'competition_id' }),
    __metadata("design:type", competition_entity_1.Competition)
], Match.prototype, "competition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'competition_id' }),
    __metadata("design:type", String)
], Match.prototype, "competition_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => season_entity_1.Season, (s) => s.matches, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'season_id' }),
    __metadata("design:type", season_entity_1.Season)
], Match.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'season_id' }),
    __metadata("design:type", String)
], Match.prototype, "season_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'home_team_id' }),
    __metadata("design:type", team_entity_1.Team)
], Match.prototype, "home_team", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'home_team_id' }),
    __metadata("design:type", String)
], Match.prototype, "home_team_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'away_team_id' }),
    __metadata("design:type", team_entity_1.Team)
], Match.prototype, "away_team", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'away_team_id' }),
    __metadata("design:type", String)
], Match.prototype, "away_team_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Match.prototype, "match_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "kickoff_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'scheduled' }),
    __metadata("design:type", String)
], Match.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "elapsed_minute", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "home_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "away_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "home_ht_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "away_ht_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "home_et_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "away_et_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "home_penalty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "away_penalty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "group_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "knockout_stage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "venue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Match.prototype, "attendance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Match.prototype, "referee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Match.prototype, "stats_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Match.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => match_event_entity_1.MatchEvent, (e) => e.match),
    __metadata("design:type", Array)
], Match.prototype, "events", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Match.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Match.prototype, "updated_at", void 0);
exports.Match = Match = __decorate([
    (0, typeorm_1.Entity)('matches')
], Match);
//# sourceMappingURL=match.entity.js.map