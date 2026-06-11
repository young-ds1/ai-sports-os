import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchEvent } from './match-event.entity';

@Injectable()
export class MatchEventsService {
  constructor(
    @InjectRepository(MatchEvent)
    private readonly eventRepo: Repository<MatchEvent>,
  ) {}

  async findByMatch(matchId: string): Promise<MatchEvent[]> {
    return this.eventRepo.find({
      where: { match_id: matchId },
      relations: ['player', 'team'],
      order: { minute: 'ASC' },
    });
  }

  async findByPlayer(playerId: string, limit = 20): Promise<MatchEvent[]> {
    return this.eventRepo.find({
      where: { player_id: playerId },
      relations: ['match'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async upsert(eventData: Partial<MatchEvent>): Promise<MatchEvent> {
    const existing = await this.eventRepo.findOne({
      where: {
        match_id: eventData.match_id,
        type: eventData.type,
        minute: eventData.minute,
        player_id: eventData.player_id,
        team_id: eventData.team_id,
      },
    });
    if (existing) {
      await this.eventRepo.update(existing.id, eventData);
      return existing;
    }
    const event = this.eventRepo.create(eventData);
    return this.eventRepo.save(event);
  }
}
