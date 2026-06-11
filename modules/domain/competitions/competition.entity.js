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
exports.Competition = void 0;
const typeorm_1 = require("typeorm");
const sport_entity_1 = require("../sports/sport.entity");
const season_entity_1 = require("../seasons/season.entity");
const match_entity_1 = require("../matches/match.entity");
let Competition = class Competition {
    id;
    sport;
    sport_id;
    provider;
    provider_id;
    name;
    name_zh;
    type; // 'tournament' | 'league' | 'cup'
    country;
    country_code;
    logo_url;
    meta;
    seasons;
    matches;
    created_at;
    updated_at;
};
exports.Competition = Competition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Competition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sport_entity_1.Sport, (s) => s.competitions, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sport_id' }),
    __metadata("design:type", sport_entity_1.Sport)
], Competition.prototype, "sport", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sport_id' }),
    __metadata("design:type", String)
], Competition.prototype, "sport_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Competition.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], Competition.prototype, "provider_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Competition.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Competition.prototype, "name_zh", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Competition.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Competition.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, nullable: true }),
    __metadata("design:type", String)
], Competition.prototype, "country_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Competition.prototype, "logo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Competition.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => season_entity_1.Season, (s) => s.competition),
    __metadata("design:type", Array)
], Competition.prototype, "seasons", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => match_entity_1.Match, (m) => m.competition),
    __metadata("design:type", Array)
], Competition.prototype, "matches", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Competition.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Competition.prototype, "updated_at", void 0);
exports.Competition = Competition = __decorate([
    (0, typeorm_1.Entity)('competitions')
], Competition);
//# sourceMappingURL=competition.entity.js.map