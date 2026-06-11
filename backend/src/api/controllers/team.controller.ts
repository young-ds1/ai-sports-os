import { Controller, Get, Param } from '@nestjs/common';
import { TeamsService } from '../../../../modules/domain/teams/teams.service';
import { MatchesService } from '../../../../modules/domain/matches/matches.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/teams')
export class TeamController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly matchesService: MatchesService,
  ) {}

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    const team = await this.teamsService.findById(id);
    if (!team) return { error: 'Team not found' };

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
}
