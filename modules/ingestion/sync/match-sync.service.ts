import { Injectable, Logger } from '@nestjs/common';
import { ProviderRouterService } from '../router/provider-router.service';
import { MatchesService } from '../../domain/matches/matches.service';
import { TeamsService } from '../../domain/teams/teams.service';

@Injectable()
export class MatchSyncService {
  private readonly logger = new Logger(MatchSyncService.name);

  constructor(
    private readonly router: ProviderRouterService,
    private readonly matchesService: MatchesService,
    private readonly teamsService: TeamsService,
  ) {}

  async syncFixtures(provider: string, date: string): Promise<void> {
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
      } as any);
    }

    this.logger.log(`Synced ${rawMatches.length} matches for ${date}`);
  }

  async syncLiveMatches(provider: string): Promise<void> {
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
      } as any);
    }

    if (liveMatches.length > 0) {
      this.logger.log(`Synced ${liveMatches.length} live matches`);
    }
  }
}
