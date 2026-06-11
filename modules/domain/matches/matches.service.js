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
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("./match.entity");
let MatchesService = class MatchesService {
    matchRepo;
    constructor(matchRepo) {
        this.matchRepo = matchRepo;
    }
    async findById(id) {
        return this.matchRepo.findOne({
            where: { id },
            relations: ['home_team', 'away_team', 'competition', 'events', 'events.player'],
        });
    }
    async findTodayMatches() {
        const today = new Date().toISOString().split('T')[0];
        return this.matchRepo.find({
            where: { match_date: today },
            relations: ['home_team', 'away_team', 'competition'],
            order: { kickoff_time: 'ASC' },
        });
    }
    async findByDate(date) {
        return this.matchRepo.find({
            where: { match_date: date },
            relations: ['home_team', 'away_team', 'competition'],
            order: { kickoff_time: 'ASC' },
        });
    }
    async findLiveMatches() {
        return this.matchRepo.find({
            where: { status: 'live' },
            relations: ['home_team', 'away_team', 'competition'],
        });
    }
    async findByCompetition(competitionId) {
        return this.matchRepo.find({
            where: { competition_id: competitionId },
            relations: ['home_team', 'away_team'],
            order: { match_date: 'DESC', kickoff_time: 'ASC' },
        });
    }
    async findByTeam(teamId, limit = 5) {
        return this.matchRepo.find({
            where: [
                { home_team_id: teamId },
                { away_team_id: teamId },
            ],
            relations: ['home_team', 'away_team', 'competition'],
            order: { match_date: 'DESC' },
            take: limit,
        });
    }
    async upsert(matchData) {
        const existing = await this.matchRepo.findOne({
            where: { provider: matchData.provider, provider_id: matchData.provider_id },
        });
        if (existing) {
            await this.matchRepo.update(existing.id, matchData);
            return this.findById(existing.id);
        }
        const match = this.matchRepo.create(matchData);
        return this.matchRepo.save(match);
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], MatchesService);
//# sourceMappingURL=matches.service.js.map