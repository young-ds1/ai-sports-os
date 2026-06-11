export interface RawCompetition {
    provider_id: number;
    name: string;
    type: string;
    country?: string;
    country_code?: string;
    logo_url?: string;
}
export interface RawSeason {
    provider_id?: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}
export interface RawTeam {
    provider_id: number;
    name: string;
    short_name?: string;
    country?: string;
    country_code?: string;
    logo_url?: string;
    venue?: string;
    coach?: string;
    founded?: number;
}
export interface RawPlayer {
    provider_id: number;
    name: string;
    position?: string;
    nationality?: string;
    birth_date?: string;
    photo_url?: string;
    number?: number;
}
export interface RawMatch {
    provider_id: number;
    home_team_provider_id: number;
    away_team_provider_id: number;
    match_date: string;
    kickoff_time?: string;
    status: string;
    home_score?: number;
    away_score?: number;
    home_ht_score?: number;
    away_ht_score?: number;
    round?: string;
    group_name?: string;
    venue?: string;
    city?: string;
    referee?: string;
    elapsed_minute?: number;
}
export interface RawMatchEvent {
    type: string;
    minute: number;
    extra_minute?: number;
    player_name?: string;
    team_provider_id?: number;
    comment?: string;
}
export interface RawStanding {
    team_provider_id: number;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    points: number;
    form?: string;
    group_name?: string;
}
export interface IProviderAdapter {
    readonly provider: string;
    getCompetitions(): Promise<RawCompetition[]>;
    getSeasons(competitionProviderId: number): Promise<RawSeason[]>;
    getTeams(competitionProviderId: number, season: string): Promise<RawTeam[]>;
    getPlayers(teamProviderId: number): Promise<RawPlayer[]>;
    getFixtures(date: string): Promise<RawMatch[]>;
    getMatchDetail(matchProviderId: number): Promise<{
        match: RawMatch;
        events: RawMatchEvent[];
    }>;
    getLiveMatches(): Promise<RawMatch[]>;
    getStandings(competitionProviderId: number, season: string): Promise<RawStanding[]>;
}
//# sourceMappingURL=provider.interface.d.ts.map