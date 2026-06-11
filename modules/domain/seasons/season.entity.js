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
exports.Season = void 0;
const typeorm_1 = require("typeorm");
const competition_entity_1 = require("../competitions/competition.entity");
const match_entity_1 = require("../matches/match.entity");
let Season = class Season {
    id;
    competition;
    competition_id;
    name; // '2026' | '2026-27'
    start_date;
    end_date;
    is_current;
    provider;
    provider_id;
    meta;
    matches;
    created_at;
};
exports.Season = Season;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Season.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => competition_entity_1.Competition, (c) => c.seasons, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'competition_id' }),
    __metadata("design:type", competition_entity_1.Competition)
], Season.prototype, "competition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'competition_id' }),
    __metadata("design:type", String)
], Season.prototype, "competition_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Season.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], Season.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], Season.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Season.prototype, "is_current", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Season.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Season.prototype, "provider_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Season.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => match_entity_1.Match, (m) => m.season),
    __metadata("design:type", Array)
], Season.prototype, "matches", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Season.prototype, "created_at", void 0);
exports.Season = Season = __decorate([
    (0, typeorm_1.Entity)('seasons')
], Season);
//# sourceMappingURL=season.entity.js.map