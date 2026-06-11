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
exports.MatchEvent = void 0;
const typeorm_1 = require("typeorm");
const match_entity_1 = require("./match.entity");
const player_entity_1 = require("../players/player.entity");
const team_entity_1 = require("../teams/team.entity");
let MatchEvent = class MatchEvent {
    id;
    match;
    match_id;
    player;
    player_id;
    team;
    team_id;
    related_player;
    related_player_id;
    type;
    minute;
    extra_minute;
    comment;
    meta;
    created_at;
};
exports.MatchEvent = MatchEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MatchEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_entity_1.Match, (m) => m.events, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'match_id' }),
    __metadata("design:type", match_entity_1.Match)
], MatchEvent.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'match_id' }),
    __metadata("design:type", String)
], MatchEvent.prototype, "match_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => player_entity_1.Player, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'player_id' }),
    __metadata("design:type", player_entity_1.Player)
], MatchEvent.prototype, "player", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id', nullable: true }),
    __metadata("design:type", String)
], MatchEvent.prototype, "player_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", team_entity_1.Team)
], MatchEvent.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id' }),
    __metadata("design:type", String)
], MatchEvent.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => player_entity_1.Player, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'related_player_id' }),
    __metadata("design:type", player_entity_1.Player)
], MatchEvent.prototype, "related_player", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'related_player_id', nullable: true }),
    __metadata("design:type", String)
], MatchEvent.prototype, "related_player_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], MatchEvent.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], MatchEvent.prototype, "minute", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], MatchEvent.prototype, "extra_minute", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", String)
], MatchEvent.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], MatchEvent.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], MatchEvent.prototype, "created_at", void 0);
exports.MatchEvent = MatchEvent = __decorate([
    (0, typeorm_1.Entity)('match_events')
], MatchEvent);
//# sourceMappingURL=match-event.entity.js.map