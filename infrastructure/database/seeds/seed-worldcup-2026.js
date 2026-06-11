"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const datasource_config_1 = require("../datasource.config");
async function seed() {
    const ds = await datasource_config_1.AppDataSource.initialize();
    const query = ds.createQueryRunner();
    console.log('🌱 Seeding World Cup 2026 data...');
    // 1. Sport
    await query.query(`
    INSERT INTO sports (id, name, name_zh, slug, icon) VALUES
    ('sport-football', 'football', '足球', 'football', '⚽')
    ON CONFLICT (slug) DO NOTHING;
  `);
    // 2. Competition
    await query.query(`
    INSERT INTO competitions (id, sport_id, provider, provider_id, name, name_zh, type)
    VALUES ('comp-worldcup-2026', 'sport-football', 'api-football', 1, 'FIFA World Cup', '2026世界杯', 'tournament')
    ON CONFLICT (provider, provider_id) DO NOTHING;
  `);
    // 3. Season
    await query.query(`
    INSERT INTO seasons (id, competition_id, name, start_date, end_date, is_current, provider)
    VALUES ('season-wc2026', 'comp-worldcup-2026', '2026', '2026-06-12', '2026-07-19', TRUE, 'api-football')
    ON CONFLICT (competition_id, name) DO NOTHING;
  `);
    // 4. Teams (8 — 2 groups worth)
    const teams = [
        ['team-arg', 'Argentina', '阿根廷', 'ARG', 'Lionel Scaloni'],
        ['team-bra', 'Brazil', '巴西', 'BRA', 'Dorival Júnior'],
        ['team-fra', 'France', '法国', 'FRA', 'Didier Deschamps'],
        ['team-eng', 'England', '英格兰', 'ENG', 'Thomas Tuchel'],
        ['team-ger', 'Germany', '德国', 'GER', 'Julian Nagelsmann'],
        ['team-esp', 'Spain', '西班牙', 'ESP', 'Luis de la Fuente'],
        ['team-por', 'Portugal', '葡萄牙', 'POR', 'Roberto Martínez'],
        ['team-ned', 'Netherlands', '荷兰', 'NED', 'Ronald Koeman'],
    ];
    for (let i = 0; i < teams.length; i++) {
        const [id, name, nameZh, short, coach] = teams[i];
        await query.query(`
      INSERT INTO teams (id, provider, provider_id, name, name_zh, short_name, country, country_code, type, coach)
      VALUES ('${id}', 'api-football', ${10 + i}, '${name}', '${nameZh}', '${short}', '${name}', '${short}', 'national', '${coach}')
      ON CONFLICT (provider, provider_id) DO UPDATE SET name_zh = '${nameZh}', coach = '${coach}';
    `);
    }
    // 5. Matches (4 matches — Group A style)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const matches = [
        {
            id: 'match-001', provider_id: 1001,
            home: 'team-arg', away: 'team-bra',
            date: today, time: '20:00:00', status: 'scheduled',
            round: 'Group Stage · Matchday 1', group_name: 'A',
            venue: 'Estadio Azteca', city: 'Mexico City',
        },
        {
            id: 'match-002', provider_id: 1002,
            home: 'team-fra', away: 'team-eng',
            date: today, time: '17:00:00', status: 'live',
            home_score: 2, away_score: 1, home_ht_score: 1, away_ht_score: 0,
            elapsed_minute: 67,
            round: 'Group Stage · Matchday 1', group_name: 'B',
            venue: 'MetLife Stadium', city: 'New Jersey',
            stats: { home_possession: 52, home_shots: 8, away_shots: 6, home_shots_on_target: 4, away_shots_on_target: 2 },
        },
        {
            id: 'match-003', provider_id: 1003,
            home: 'team-ger', away: 'team-esp',
            date: yesterday, time: '20:00:00', status: 'finished',
            home_score: 3, away_score: 3, home_ht_score: 2, away_ht_score: 1,
            round: 'Group Stage · Matchday 1', group_name: 'C',
            venue: 'AT&T Stadium', city: 'Dallas',
            stats: { home_possession: 48, home_shots: 12, away_shots: 14, home_shots_on_target: 7, away_shots_on_target: 8 },
        },
        {
            id: 'match-004', provider_id: 1004,
            home: 'team-por', away: 'team-ned',
            date: tomorrow, time: '17:00:00', status: 'scheduled',
            round: 'Group Stage · Matchday 1', group_name: 'D',
            venue: 'SoFi Stadium', city: 'Los Angeles',
        },
    ];
    for (const m of matches) {
        await query.query(`
      INSERT INTO matches (
        id, provider, provider_id, competition_id, season_id,
        home_team_id, away_team_id, match_date, kickoff_time, status,
        home_score, away_score, home_ht_score, away_ht_score,
        elapsed_minute, round, group_name, venue, city, stats_summary
      ) VALUES (
        '${m.id}', 'api-football', ${m.provider_id},
        'comp-worldcup-2026', 'season-wc2026',
        '${m.home}', '${m.away}',
        '${m.date}', '${m.time}', '${m.status}',
        ${m.home_score ?? 'NULL'}, ${m.away_score ?? 'NULL'},
        ${m.home_ht_score ?? 'NULL'}, ${m.away_ht_score ?? 'NULL'},
        ${m.elapsed_minute ?? 'NULL'},
        '${m.round}', '${m.group_name}',
        '${m.venue}', '${m.city}',
        '${JSON.stringify(m.stats || {})}'::jsonb
      )
      ON CONFLICT (provider, provider_id) DO NOTHING;
    `);
    }
    // 6. Match Events (for finished match: Germany 3-3 Spain)
    const events = [
        { match_id: 'match-003', type: 'goal', minute: 12, player_name: 'Jamal Musiala', team: 'team-ger', comment: 'Goal by Musiala' },
        { match_id: 'match-003', type: 'goal', minute: 24, player_name: 'Kai Havertz', team: 'team-ger', comment: 'Goal by Havertz, penalty' },
        { match_id: 'match-003', type: 'goal', minute: 41, player_name: 'Lamine Yamal', team: 'team-esp', comment: 'Goal by Yamal' },
        { match_id: 'match-003', type: 'goal', minute: 56, player_name: 'Nico Williams', team: 'team-esp', comment: 'Goal by Williams' },
        { match_id: 'match-003', type: 'goal', minute: 72, player_name: 'Florian Wirtz', team: 'team-ger', comment: 'Goal by Wirtz' },
        { match_id: 'match-003', type: 'goal', minute: 88, player_name: 'Pedri', team: 'team-esp', comment: 'Equalizer by Pedri' },
        { match_id: 'match-003', type: 'yellow_card', minute: 35, player_name: 'Antonio Rüdiger', team: 'team-ger', comment: 'Tactical foul' },
        { match_id: 'match-003', type: 'yellow_card', minute: 64, player_name: 'Rodri', team: 'team-esp', comment: 'Late tackle' },
    ];
    // Create placeholder players for events
    for (const ev of events) {
        const playerId = `player-${ev.player_name.toLowerCase().replace(/\s+/g, '-')}`;
        await query.query(`
      INSERT INTO players (id, provider, provider_id, name, position, nationality_code)
      VALUES ('${playerId}', 'api-football', ${Math.floor(Math.random() * 10000)}, '${ev.player_name}', 'FW', '')
      ON CONFLICT (provider, provider_id) DO NOTHING;
    `);
        await query.query(`
      INSERT INTO match_events (match_id, player_id, team_id, type, minute, comment)
      VALUES ('${ev.match_id}', '${playerId}', '${ev.team}', '${ev.type}', ${ev.minute}, '${ev.comment}')
      ON CONFLICT DO NOTHING;
    `);
    }
    await query.release();
    console.log('✅ Seed complete: 1 sport, 1 competition, 1 season, 8 teams, 4 matches, 8 events');
    await ds.destroy();
}
seed().catch(console.error);
//# sourceMappingURL=seed-worldcup-2026.js.map