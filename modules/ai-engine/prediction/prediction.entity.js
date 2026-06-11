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
exports.AiPrediction = void 0;
const typeorm_1 = require("typeorm");
const match_entity_1 = require("../../domain/matches/match.entity");
let AiPrediction = class AiPrediction {
    id;
    match;
    match_id;
    prediction;
    model_version;
    input_context;
    confidence_score;
    tokens_used;
    generated_at;
    is_verified;
    is_correct;
    actual_result;
    created_at;
};
exports.AiPrediction = AiPrediction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiPrediction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_entity_1.Match, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'match_id' }),
    __metadata("design:type", match_entity_1.Match)
], AiPrediction.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'match_id' }),
    __metadata("design:type", String)
], AiPrediction.prototype, "match_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Object)
], AiPrediction.prototype, "prediction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], AiPrediction.prototype, "model_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json' }),
    __metadata("design:type", Object)
], AiPrediction.prototype, "input_context", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], AiPrediction.prototype, "confidence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], AiPrediction.prototype, "tokens_used", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', }),
    __metadata("design:type", Date)
], AiPrediction.prototype, "generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AiPrediction.prototype, "is_verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], AiPrediction.prototype, "is_correct", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], AiPrediction.prototype, "actual_result", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], AiPrediction.prototype, "created_at", void 0);
exports.AiPrediction = AiPrediction = __decorate([
    (0, typeorm_1.Entity)('ai_predictions')
], AiPrediction);
//# sourceMappingURL=prediction.entity.js.map