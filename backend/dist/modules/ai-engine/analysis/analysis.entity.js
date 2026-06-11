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
exports.AiAnalysis = void 0;
const typeorm_1 = require("typeorm");
const match_entity_1 = require("../../domain/matches/match.entity");
let AiAnalysis = class AiAnalysis {
    id;
    match;
    match_id;
    team_id;
    player_id;
    analysis_type; // 'pre_match' | 'post_match' | 'team_deep' | 'player_deep'
    content;
    model_version;
    input_context;
    confidence_score;
    tokens_used;
    generated_at;
    expires_at;
    is_cached;
    created_at;
};
exports.AiAnalysis = AiAnalysis;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiAnalysis.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_entity_1.Match, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'match_id' }),
    __metadata("design:type", match_entity_1.Match)
], AiAnalysis.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'match_id', nullable: true }),
    __metadata("design:type", String)
], AiAnalysis.prototype, "match_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', nullable: true }),
    __metadata("design:type", String)
], AiAnalysis.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id', nullable: true }),
    __metadata("design:type", String)
], AiAnalysis.prototype, "player_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30 }),
    __metadata("design:type", String)
], AiAnalysis.prototype, "analysis_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Object)
], AiAnalysis.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], AiAnalysis.prototype, "model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Object)
], AiAnalysis.prototype, "input_context", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], AiAnalysis.prototype, "confidence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], AiAnalysis.prototype, "tokens_used", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], AiAnalysis.prototype, "generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], AiAnalysis.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AiAnalysis.prototype, "is_cached", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], AiAnalysis.prototype, "created_at", void 0);
exports.AiAnalysis = AiAnalysis = __decorate([
    (0, typeorm_1.Entity)('ai_analysis')
], AiAnalysis);
//# sourceMappingURL=analysis.entity.js.map