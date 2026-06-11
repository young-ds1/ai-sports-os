import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlayersService } from '../../../../modules/domain/players/players.service';
import { MatchEventsService } from '../../../../modules/domain/matches/match-events.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/players')
export class PlayerController {
  constructor(
    private readonly playersService: PlayersService,
    private readonly matchEventsService: MatchEventsService,
  ) {}

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    const player = await this.playersService.findById(id);
    if (!player) return { error: 'Player not found' };

    const recentEvents = await this.matchEventsService.findByPlayer(id, 20);

    return {
      id: player.id,
      name: player.name,
      name_zh: player.name_zh,
      position: player.position,
      nationality: player.nationality,
      birth_date: player.birth_date,
      photo_url: player.photo_url,
      preferred_foot: player.preferred_foot,
      recent_events: recentEvents.map(e => ({
        type: e.type,
        minute: e.minute,
        comment: e.comment,
        match_id: e.match_id,
      })),
    };
  }
}
