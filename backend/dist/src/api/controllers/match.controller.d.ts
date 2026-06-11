import { MatchesService } from '../../../../modules/domain/matches/matches.service';
export declare class MatchController {
    private readonly matchesService;
    constructor(matchesService: MatchesService);
    findAll(date?: string, competitionId?: string): Promise<import("@modules/domain/matches/match.entity").Match[]>;
    findLive(): Promise<import("@modules/domain/matches/match.entity").Match[]>;
    findById(id: string): Promise<{
        error: string;
        id?: undefined;
        home_team?: undefined;
        away_team?: undefined;
        competition?: undefined;
        match_date?: undefined;
        kickoff_time?: undefined;
        status?: undefined;
        elapsed_minute?: undefined;
        home_score?: undefined;
        away_score?: undefined;
        home_ht_score?: undefined;
        away_ht_score?: undefined;
        round?: undefined;
        group_name?: undefined;
        venue?: undefined;
        city?: undefined;
        referee?: undefined;
        stats_summary?: undefined;
        events?: undefined;
    } | {
        id: string;
        home_team: import("@modules/domain/teams/team.entity").Team;
        away_team: import("@modules/domain/teams/team.entity").Team;
        competition: import("@modules/domain/competitions/competition.entity").Competition;
        match_date: string;
        kickoff_time: string;
        status: string;
        elapsed_minute: number;
        home_score: number;
        away_score: number;
        home_ht_score: number;
        away_ht_score: number;
        round: string;
        group_name: string;
        venue: string;
        city: string;
        referee: string;
        stats_summary: Record<string, any>;
        events: {
            id: string;
            type: string;
            minute: number;
            comment: string;
            player: {
                id: string;
                name: string;
            } | null;
            team: {
                id: string;
                name: string;
            } | null;
        }[];
        error?: undefined;
    }>;
}
//# sourceMappingURL=match.controller.d.ts.map