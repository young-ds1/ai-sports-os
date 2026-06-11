import { IProviderAdapter, RawCompetition, RawSeason, RawTeam, RawPlayer, RawMatch, RawMatchEvent, RawStanding } from '../../provider.interface';
/**
 * Mock API-Football Adapter — returns World Cup 2026 data without real API calls.
 * Phase 2 uses this to seed the database. Phase 3+ replaces with real HTTP adapter.
 */
export declare class ApiFootballMockAdapter implements IProviderAdapter {
    readonly provider = "api-football";
    getCompetitions(): Promise<RawCompetition[]>;
    getSeasons(competitionProviderId: number): Promise<RawSeason[]>;
    getTeams(_competitionProviderId: number, _season: string): Promise<RawTeam[]>;
    getPlayers(_teamProviderId: number): Promise<RawPlayer[]>;
    getFixtures(date: string): Promise<RawMatch[]>;
    getMatchDetail(matchProviderId: number): Promise<{
        match: RawMatch;
        events: RawMatchEvent[];
    }>;
    getLiveMatches(): Promise<RawMatch[]>;
    getStandings(_competitionProviderId: number, _season: string): Promise<RawStanding[]>;
}
//# sourceMappingURL=api-football.mock.d.ts.map