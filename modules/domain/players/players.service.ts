import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {}

  async findById(id: string): Promise<Player | null> {
    return this.playerRepo.findOne({ where: { id } });
  }

  async findByTeam(teamId: string, seasonId: string): Promise<Player[]> {
    return this.playerRepo
      .createQueryBuilder('player')
      .innerJoin('team_seasons', 'ts', 'ts.player_id = player.id')
      .where('ts.team_id = :teamId', { teamId })
      .andWhere('ts.season_id = :seasonId', { seasonId })
      .getMany();
  }

  async upsert(playerData: Partial<Player>): Promise<Player> {
    const existing = await this.playerRepo.findOne({
      where: { provider: playerData.provider, provider_id: playerData.provider_id },
    });
    if (existing) {
      await this.playerRepo.update(existing.id, playerData);
      return this.findById(existing.id)!;
    }
    const player = this.playerRepo.create(playerData);
    return this.playerRepo.save(player);
  }
}
