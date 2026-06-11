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
exports.TeamController = void 0;
const common_1 = require("@nestjs/common");
const teams_service_1 = require("../../../../modules/domain/teams/teams.service");
const matches_service_1 = require("../../../../modules/domain/matches/matches.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let TeamController = class TeamController {
    teamsService;
    matchesService;
    constructor(teamsService, matchesService) {
        this.teamsService = teamsService;
        this.matchesService = matchesService;
    }
    async findById(id) {
        const team = await this.teamsService.findById(id);
        if (!team)
            return { error: 'Team not found' };
        const recentMatches = await this.matchesService.findByTeam(id, 5);
        return {
            id: team.id,
            name: team.name,
            name_zh: team.name_zh,
            short_name: team.short_name,
            country: team.country,
            logo_url: team.logo_url,
            coach: team.coach,
            venue: team.venue,
            type: team.type,
            recent_matches: recentMatches.map(m => ({
                id: m.id,
                home_team: { id: m.home_team?.id, name: m.home_team?.name, short_name: m.home_team?.short_name },
                away_team: { id: m.away_team?.id, name: m.away_team?.name, short_name: m.away_team?.short_name },
                home_score: m.home_score,
                away_score: m.away_score,
                status: m.status,
                match_date: m.match_date,
            })),
        };
    }
};
exports.TeamController = TeamController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "findById", null);
exports.TeamController = TeamController = __decorate([
    (0, common_1.Controller)('api/teams'),
    __metadata("design:paramtypes", [teams_service_1.TeamsService,
        matches_service_1.MatchesService])
], TeamController);
//# sourceMappingURL=team.controller.js.map