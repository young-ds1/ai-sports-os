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
exports.TeamSeason = void 0;
const typeorm_1 = require("typeorm");
const team_entity_1 = require("./team.entity");
const season_entity_1 = require("../seasons/season.entity");
const player_entity_1 = require("../players/player.entity");
let TeamSeason = class TeamSeason {
    id;
    team;
    team_id;
    season;
    season_id;
    player;
    player_id;
    shirt_number;
    position;
    is_loan;
    joined_at;
    left_at;
    created_at;
};
exports.TeamSeason = TeamSeason;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeamSeason.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", team_entity_1.Team)
], TeamSeason.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id' }),
    __metadata("design:type", String)
], TeamSeason.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => season_entity_1.Season, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'season_id' }),
    __metadata("design:type", season_entity_1.Season)
], TeamSeason.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'season_id' }),
    __metadata("design:type", String)
], TeamSeason.prototype, "season_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => player_entity_1.Player, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'player_id' }),
    __metadata("design:type", player_entity_1.Player)
], TeamSeason.prototype, "player", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", String)
], TeamSeason.prototype, "player_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], TeamSeason.prototype, "shirt_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], TeamSeason.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TeamSeason.prototype, "is_loan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], TeamSeason.prototype, "joined_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], TeamSeason.prototype, "left_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], TeamSeason.prototype, "created_at", void 0);
exports.TeamSeason = TeamSeason = __decorate([
    (0, typeorm_1.Entity)('team_seasons')
], TeamSeason);
//# sourceMappingURL=team-season.entity.js.map