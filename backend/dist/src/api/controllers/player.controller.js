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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerController = void 0;
const common_1 = require("@nestjs/common");
const players_service_1 = require("../../../../modules/domain/players/players.service");
const match_events_service_1 = require("../../../../modules/domain/matches/match-events.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let PlayerController = class PlayerController {
    playersService;
    matchEventsService;
    constructor(playersService, matchEventsService) {
        this.playersService = playersService;
        this.matchEventsService = matchEventsService;
    }
    async findById(id) {
        const player = await this.playersService.findById(id);
        if (!player)
            return { error: 'Player not found' };
        const recentEvents = await this.matchEventsService.findByPlayer(id, 20);
        return {
            id: player.id,
            name: player.name,
            name_zh: player.name_zh,
            position: player.position,
            nationality: player.nationality,
            birth_date: player.birth_date,
            photo_url: player.photo_url,
            preferred_foot: player.preferred_foot,
            recent_events: recentEvents.map(e => ({
                type: e.type,
                minute: e.minute,
                comment: e.comment,
                match_id: e.match_id,
            })),
        };
    }
};
exports.PlayerController = PlayerController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "findById", null);
exports.PlayerController = PlayerController = __decorate([
    (0, common_1.Controller)('api/players'),
    __metadata("design:paramtypes", [players_service_1.PlayersService,
        match_events_service_1.MatchEventsService])
], PlayerController);
//# sourceMappingURL=player.controller.js.map