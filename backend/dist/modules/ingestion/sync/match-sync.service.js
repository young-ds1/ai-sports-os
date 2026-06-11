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
var MatchSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchSyncService = void 0;
const common_1 = require("@nestjs/common");
const provider_router_service_1 = require("../router/provider-router.service");
const matches_service_1 = require("../../domain/matches/matches.service");
const teams_service_1 = require("../../domain/teams/teams.service");
let MatchSyncService = MatchSyncService_1 = class MatchSyncService {
    router;
    matchesService;
    teamsService;
    logger = new common_1.Logger(MatchSyncService_1.name);
    constructor(router, matchesService, teamsService) {
        this.router = router;
        this.matchesService = matchesService;
        this.teamsService = teamsService;
    }
    async syncFixtures(provider, date) {
        const adapter = this.router.getAdapter(provider);
        const rawMatches = await adapter.getFixtures(date);
        for (const raw of rawMatches) {
            // Ensure teams exist
            const teams = await adapter.getTeams(1, '2026');
            for (const t of teams) {
                await this.teamsService.upsert({
                    provider: adapter.provider,
                    provider_id: t.provider_id,
                    name: t.name,
                    short_name: t.short_name,
                    country: t.country,
                    country_code: t.country_code,
                    coach: t.coach,
                });
            }
            // Map raw team provider_ids to our UUIDs
            await this.matchesService.upsert({
                provider: adapter.provider,
                provider_id: raw.provider_id,
                competition_id: 'comp-worldcup-2026',
                season_id: 'season-wc2026',
                home_team_id: `team-${raw.home_team_provider_id}`,
                away_team_id: `team-${raw.away_team_provider_id}`,
                match_date: raw.match_date,
                kickoff_time: raw.kickoff_time,
                status: raw.status,
                home_score: raw.home_score,
                away_score: raw.away_score,
                home_ht_score: raw.home_ht_score,
                away_ht_score: raw.away_ht_score,
                elapsed_minute: raw.elapsed_minute,
                round: raw.round,
                group_name: raw.group_name,
                venue: raw.venue,
                city: raw.city,
                referee: raw.referee,
            });
        }
        this.logger.log(`Synced ${rawMatches.length} matches for ${date}`);
    }
    async syncLiveMatches(provider) {
        const adapter = this.router.getAdapter(provider);
        const liveMatches = await adapter.getLiveMatches();
        for (const raw of liveMatches) {
            const detail = await adapter.getMatchDetail(raw.provider_id);
            await this.matchesService.upsert({
                provider: adapter.provider,
                provider_id: detail.match.provider_id,
                competition_id: 'comp-worldcup-2026',
                season_id: 'season-wc2026',
                home_team_id: `team-${detail.match.home_team_provider_id}`,
                away_team_id: `team-${detail.match.away_team_provider_id}`,
                match_date: detail.match.match_date,
                kickoff_time: detail.match.kickoff_time,
                status: detail.match.status,
                home_score: detail.match.home_score,
                away_score: detail.match.away_score,
                home_ht_score: detail.match.home_ht_score,
                away_ht_score: detail.match.away_ht_score,
                elapsed_minute: detail.match.elapsed_minute,
                round: detail.match.round,
                group_name: detail.match.group_name,
                venue: detail.match.venue,
                city: detail.match.city,
            });
        }
        if (liveMatches.length > 0) {
            this.logger.log(`Synced ${liveMatches.length} live matches`);
        }
    }
};
exports.MatchSyncService = MatchSyncService;
exports.MatchSyncService = MatchSyncService = MatchSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_router_service_1.ProviderRouterService,
        matches_service_1.MatchesService,
        teams_service_1.TeamsService])
], MatchSyncService);
//# sourceMappingURL=match-sync.service.js.map