"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiFootballMockAdapter = void 0;
/**
 * Mock API-Football Adapter — returns World Cup 2026 data without real API calls.
 * Phase 2 uses this to seed the database. Phase 3+ replaces with real HTTP adapter.
 */
class ApiFootballMockAdapter {
    provider = 'api-football';
    async getCompetitions() {
        return [
            { provider_id: 1, name: 'FIFA World Cup', type: 'tournament' },
            { provider_id: 2, name: 'UEFA Champions League', type: 'cup', country: 'Europe' },
        ];
    }
    async getSeasons(competitionProviderId) {
        return [
            { name: '2026', start_date: '2026-06-12', end_date: '2026-07-19', is_current: true },
        ];
    }
    async getTeams(_competitionProviderId, _season) {
        return [
            { provider_id: 10, name: 'Argentina', short_name: 'ARG', country: 'Argentina', country_code: 'ARG', coach: 'Lionel Scaloni' },
            { provider_id: 11, name: 'Brazil', short_name: 'BRA', country: 'Brazil', country_code: 'BRA', coach: 'Dorival Júnior' },
            { provider_id: 12, name: 'France', short_name: 'FRA', country: 'France', country_code: 'FRA', coach: 'Didier Deschamps' },
            { provider_id: 13, name: 'England', short_name: 'ENG', country: 'England', country_code: 'ENG', coach: 'Thomas Tuchel' },
            { provider_id: 14, name: 'Germany', short_name: 'GER', country: 'Germany', country_code: 'GER', coach: 'Julian Nagelsmann' },
            { provider_id: 15, name: 'Spain', short_name: 'ESP', country: 'Spain', country_code: 'ESP', coach: 'Luis de la Fuente' },
            { provider_id: 16, name: 'Portugal', short_name: 'POR', country: 'Portugal', country_code: 'POR', coach: 'Roberto Martínez' },
            { provider_id: 17, name: 'Netherlands', short_name: 'NED', country: 'Netherlands', country_code: 'NED', coach: 'Ronald Koeman' },
        ];
    }
    async getPlayers(_teamProviderId) {
        return [
            { provider_id: 1001, name: 'Lionel Messi', position: 'FW', nationality: 'Argentina', number: 10 },
            { provider_id: 1002, name: 'Julián Álvarez', position: 'FW', nationality: 'Argentina', number: 9 },
            { provider_id: 1003, name: 'Vinicius Jr', position: 'FW', nationality: 'Brazil', number: 7 },
            { provider_id: 1004, name: 'Rodrygo', position: 'FW', nationality: 'Brazil', number: 11 },
            { provider_id: 1005, name: 'Kylian Mbappé', position: 'FW', nationality: 'France', number: 10 },
            { provider_id: 1006, name: 'Jude Bellingham', position: 'MF', nationality: 'England', number: 10 },
            { provider_id: 1007, name: 'Jamal Musiala', position: 'MF', nationality: 'Germany', number: 10 },
            { provider_id: 1008, name: 'Lamine Yamal', position: 'FW', nationality: 'Spain', number: 19 },
        ];
    }
    async getFixtures(date) {
        return [
            {
                provider_id: 1001, home_team_provider_id: 10, away_team_provider_id: 11,
                match_date: date, kickoff_time: '20:00:00', status: 'scheduled',
                round: 'Group Stage · Matchday 1', group_name: 'A',
                venue: 'Estadio Azteca', city: 'Mexico City',
            },
            {
                provider_id: 1002, home_team_provider_id: 12, away_team_provider_id: 13,
                match_date: date, kickoff_time: '17:00:00', status: 'live',
                home_score: 2, away_score: 1, home_ht_score: 1, away_ht_score: 0,
                elapsed_minute: 67,
                round: 'Group Stage · Matchday 1', group_name: 'B',
                venue: 'MetLife Stadium', city: 'New Jersey',
            },
        ];
    }
    async getMatchDetail(matchProviderId) {
        return {
            match: {
                provider_id: matchProviderId, home_team_provider_id: 14, away_team_provider_id: 15,
                match_date: new Date().toISOString().split('T')[0], kickoff_time: '20:00:00',
                status: 'finished', home_score: 3, away_score: 3, home_ht_score: 2, away_ht_score: 1,
                round: 'Group Stage · Matchday 1', group_name: 'C',
                venue: 'AT&T Stadium', city: 'Dallas',
            },
            events: [
                { type: 'goal', minute: 12, player_name: 'Jamal Musiala', team_provider_id: 14, comment: 'Goal by Musiala' },
                { type: 'goal', minute: 24, player_name: 'Kai Havertz', team_provider_id: 14, comment: 'Goal by Havertz, penalty' },
                { type: 'goal', minute: 41, player_name: 'Lamine Yamal', team_provider_id: 15, comment: 'Goal by Yamal' },
                { type: 'goal', minute: 56, player_name: 'Nico Williams', team_provider_id: 15, comment: 'Goal by Williams' },
                { type: 'goal', minute: 72, player_name: 'Florian Wirtz', team_provider_id: 14, comment: 'Goal by Wirtz' },
                { type: 'goal', minute: 88, player_name: 'Pedri', team_provider_id: 15, comment: 'Equalizer by Pedri' },
                { type: 'yellow_card', minute: 35, player_name: 'Antonio Rüdiger', team_provider_id: 14, comment: 'Tactical foul' },
                { type: 'yellow_card', minute: 64, player_name: 'Rodri', team_provider_id: 15, comment: 'Late tackle' },
            ],
        };
    }
    async getLiveMatches() {
        const today = new Date().toISOString().split('T')[0];
        return [{
                provider_id: 1002, home_team_provider_id: 12, away_team_provider_id: 13,
                match_date: today, kickoff_time: '17:00:00', status: 'live',
                home_score: 2, away_score: 1, home_ht_score: 1, away_ht_score: 0,
                elapsed_minute: 67,
                round: 'Group Stage · Matchday 1', group_name: 'B',
                venue: 'MetLife Stadium', city: 'New Jersey',
            }];
    }
    async getStandings(_competitionProviderId, _season) {
        return [
            { team_provider_id: 10, position: 1, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 2, goals_against: 1, points: 3, form: 'W', group_name: 'A' },
            { team_provider_id: 14, position: 1, played: 1, won: 0, drawn: 1, lost: 0, goals_for: 3, goals_against: 3, points: 1, form: 'D', group_name: 'C' },
            { team_provider_id: 15, position: 2, played: 1, won: 0, drawn: 1, lost: 0, goals_for: 3, goals_against: 3, points: 1, form: 'D', group_name: 'C' },
        ];
    }
}
exports.ApiFootballMockAdapter = ApiFootballMockAdapter;
//# sourceMappingURL=api-football.mock.js.map