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
exports.MatchController = void 0;
const common_1 = require("@nestjs/common");
const matches_service_1 = require("../../../../modules/domain/matches/matches.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let MatchController = class MatchController {
    matchesService;
    constructor(matchesService) {
        this.matchesService = matchesService;
    }
    async findAll(date, competitionId) {
        if (date)
            return this.matchesService.findByDate(date);
        if (competitionId)
            return this.matchesService.findByCompetition(competitionId);
        return this.matchesService.findTodayMatches();
    }
    async findLive() {
        return this.matchesService.findLiveMatches();
    }
    async findById(id) {
        const match = await this.matchesService.findById(id);
        if (!match)
            return { error: 'Match not found' };
        // Flatten relations for API response
        return {
            id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            competition: match.competition,
            match_date: match.match_date,
            kickoff_time: match.kickoff_time,
            status: match.status,
            elapsed_minute: match.elapsed_minute,
            home_score: match.home_score,
            away_score: match.away_score,
            home_ht_score: match.home_ht_score,
            away_ht_score: match.away_ht_score,
            round: match.round,
            group_name: match.group_name,
            venue: match.venue,
            city: match.city,
            referee: match.referee,
            stats_summary: match.stats_summary,
            events: match.events?.map(e => ({
                id: e.id,
                type: e.type,
                minute: e.minute,
                comment: e.comment,
                player: e.player ? { id: e.player.id, name: e.player.name } : null,
                team: e.team ? { id: e.team.id, name: e.team.name } : null,
            })),
        };
    }
};
exports.MatchController = MatchController;
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('competition')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "findLive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "findById", null);
exports.MatchController = MatchController = __decorate([
    (0, common_1.Controller)('api/matches'),
    __metadata("design:paramtypes", [matches_service_1.MatchesService])
], MatchController);
//# sourceMappingURL=match.controller.js.map