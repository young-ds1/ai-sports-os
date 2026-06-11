import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async findById(id: string): Promise<Team | null> {
    return this.teamRepo.findOne({ where: { id } });
  }

  async findByCompetition(competitionId: string): Promise<Team[]> {
    // Teams linked via team_seasons join — simplified for MVP
    return this.teamRepo
      .createQueryBuilder('team')
      .innerJoin('team_seasons', 'ts', 'ts.team_id = team.id')
      .innerJoin('seasons', 's', 's.id = ts.season_id')
      .where('s.competition_id = :competitionId', { competitionId })
      .getMany();
  }

  async upsert(teamData: Partial<Team>): Promise<Team> {
    const existing = await this.teamRepo.findOne({
      where: { provider: teamData.provider, provider_id: teamData.provider_id },
    });
    if (existing) {
      await this.teamRepo.update(existing.id, teamData);
      return this.findById(existing.id)!;
    }
    const team = this.teamRepo.create(teamData);
    return this.teamRepo.save(team);
  }
}
