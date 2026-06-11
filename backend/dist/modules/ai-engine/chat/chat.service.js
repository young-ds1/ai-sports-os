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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_session_entity_1 = require("./chat-session.entity");
const chat_message_entity_1 = require("./chat-message.entity");
let ChatService = class ChatService {
    sessionRepo;
    messageRepo;
    constructor(sessionRepo, messageRepo) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
    }
    async createSession(data) {
        const session = this.sessionRepo.create({
            user_id: data.userId,
            match_id: data.matchId || null,
            title: data.title || '新对话',
            message_count: 0,
        });
        return this.sessionRepo.save(session);
    }
    async addMessage(data) {
        const msg = this.messageRepo.create({
            session_id: data.sessionId,
            role: data.role,
            message: data.message,
            sources: data.sources || [],
            model_version: data.modelVersion,
            tokens_used: data.tokensUsed,
            confidence_score: data.confidenceScore,
        });
        const saved = await this.messageRepo.save(msg);
        // Update message count
        await this.sessionRepo.increment({ id: data.sessionId }, 'message_count', 1);
        await this.sessionRepo.update(data.sessionId, { updated_at: new Date() });
        return saved;
    }
    async getSession(sessionId) {
        return this.sessionRepo.findOne({
            where: { id: sessionId },
            relations: ['messages'],
        });
    }
    async getUserSessions(userId) {
        return this.sessionRepo.find({
            where: { user_id: userId, is_active: true },
            order: { updated_at: 'DESC' },
            take: 20,
        });
    }
    async getMessages(sessionId) {
        return this.messageRepo.find({
            where: { session_id: sessionId },
            order: { created_at: 'ASC' },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_session_entity_1.ChatSession)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], ChatService);
//# sourceMappingURL=chat.service.js.map