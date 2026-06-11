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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchEventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_event_entity_1 = require("./match-event.entity");
let MatchEventsService = class MatchEventsService {
    eventRepo;
    constructor(eventRepo) {
        this.eventRepo = eventRepo;
    }
    async findByMatch(matchId) {
        return this.eventRepo.find({
            where: { match_id: matchId },
            relations: ['player', 'team'],
            order: { minute: 'ASC' },
        });
    }
    async findByPlayer(playerId, limit = 20) {
        return this.eventRepo.find({
            where: { player_id: playerId },
            relations: ['match'],
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
    async upsert(eventData) {
        const existing = await this.eventRepo.findOne({
            where: {
                match_id: eventData.match_id,
                type: eventData.type,
                minute: eventData.minute,
                player_id: eventData.player_id,
                team_id: eventData.team_id,
            },
        });
        if (existing) {
            await this.eventRepo.update(existing.id, eventData);
            return existing;
        }
        const event = this.eventRepo.create(eventData);
        return this.eventRepo.save(event);
    }
};
exports.MatchEventsService = MatchEventsService;
exports.MatchEventsService = MatchEventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_event_entity_1.MatchEvent)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], MatchEventsService);
//# sourceMappingURL=match-events.service.js.map