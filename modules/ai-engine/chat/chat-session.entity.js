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
exports.ChatSession = void 0;
const typeorm_1 = require("typeorm");
const chat_message_entity_1 = require("./chat-message.entity");
const match_entity_1 = require("../../domain/matches/match.entity");
let ChatSession = class ChatSession {
    id;
    user_id;
    match;
    match_id;
    team_id;
    player_id;
    title;
    message_count;
    is_active;
    messages;
    created_at;
    updated_at;
};
exports.ChatSession = ChatSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], ChatSession.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_entity_1.Match, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'match_id' }),
    __metadata("design:type", match_entity_1.Match)
], ChatSession.prototype, "match", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'match_id', nullable: true }),
    __metadata("design:type", String)
], ChatSession.prototype, "match_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', nullable: true }),
    __metadata("design:type", String)
], ChatSession.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id', nullable: true }),
    __metadata("design:type", String)
], ChatSession.prototype, "player_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", String)
], ChatSession.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ChatSession.prototype, "message_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ChatSession.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_message_entity_1.ChatMessage, (m) => m.session),
    __metadata("design:type", Array)
], ChatSession.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], ChatSession.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], ChatSession.prototype, "updated_at", void 0);
exports.ChatSession = ChatSession = __decorate([
    (0, typeorm_1.Entity)('ai_chat_sessions')
], ChatSession);
//# sourceMappingURL=chat-session.entity.js.map