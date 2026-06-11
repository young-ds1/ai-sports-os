import { TeamsService } from '../../../../modules/domain/teams/teams.service';
import { MatchesService } from '../../../../modules/domain/matches/matches.service';
export declare class TeamController {
    private readonly teamsService;
    private readonly matchesService;
    constructor(teamsService: TeamsService, matchesService: MatchesService);
    findById(id: string): Promise<{
        error: string;
        id?: undefined;
        name?: undefined;
        name_zh?: undefined;
        short_name?: undefined;
        country?: undefined;
        logo_url?: undefined;
        coach?: undefined;
        venue?: undefined;
        type?: undefined;
        recent_matches?: undefined;
    } | {
        id: string;
        name: string;
        name_zh: string;
        short_name: string;
        country: string;
        logo_url: string;
        coach: string;
        venue: string;
        type: string;
        recent_matches: {
            id: string;
            home_team: {
                id: string;
                name: string;
                short_name: string;
            };
            away_team: {
                id: string;
                name: string;
                short_name: string;
            };
            home_score: number;
            away_score: number;
            status: string;
            match_date: string;
        }[];
        error?: undefined;
    }>;
}
//# sourceMappingURL=team.controller.d.ts.map