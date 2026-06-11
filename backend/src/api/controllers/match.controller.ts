import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchesService } from '../../../../modules/domain/matches/matches.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/matches')
export class MatchController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @Public()
  async findAll(@Query('date') date?: string, @Query('competition') competitionId?: string) {
    if (date) return this.matchesService.findByDate(date);
    if (competitionId) return this.matchesService.findByCompetition(competitionId);
    return this.matchesService.findTodayMatches();
  }

  @Get('live')
  @Public()
  async findLive() {
    return this.matchesService.findLiveMatches();
  }

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    const match = await this.matchesService.findById(id);
    if (!match) return { error: 'Match not found' };
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
}
