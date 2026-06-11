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
exports.PlayersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const player_entity_1 = require("./player.entity");
let PlayersService = class PlayersService {
    playerRepo;
    constructor(playerRepo) {
        this.playerRepo = playerRepo;
    }
    async findById(id) {
        return this.playerRepo.findOne({ where: { id } });
    }
    async findByTeam(teamId, seasonId) {
        return this.playerRepo
            .createQueryBuilder('player')
            .innerJoin('team_seasons', 'ts', 'ts.player_id = player.id')
            .where('ts.team_id = :teamId', { teamId })
            .andWhere('ts.season_id = :seasonId', { seasonId })
            .getMany();
    }
    async upsert(playerData) {
        const existing = await this.playerRepo.findOne({
            where: { provider: playerData.provider, provider_id: playerData.provider_id },
        });
        if (existing) {
            await this.playerRepo.update(existing.id, playerData);
            return this.findById(existing.id);
        }
        const player = this.playerRepo.create(playerData);
        return this.playerRepo.save(player);
    }
};
exports.PlayersService = PlayersService;
exports.PlayersService = PlayersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(player_entity_1.Player)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], PlayersService);
//# sourceMappingURL=players.service.js.map