import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async findById(id: string): Promise<Match | null> {
    return this.matchRepo.findOne({
      where: { id },
      relations: ['home_team', 'away_team', 'competition', 'events', 'events.player'],
    });
  }

  async findTodayMatches(): Promise<Match[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.matchRepo.find({
      where: { match_date: today },
      relations: ['home_team', 'away_team', 'competition'],
      order: { kickoff_time: 'ASC' },
    });
  }

  async findByDate(date: string): Promise<Match[]> {
    return this.matchRepo.find({
      where: { match_date: date },
      relations: ['home_team', 'away_team', 'competition'],
      order: { kickoff_time: 'ASC' },
    });
  }

  async findLiveMatches(): Promise<Match[]> {
    return this.matchRepo.find({
      where: { status: 'live' },
      relations: ['home_team', 'away_team', 'competition'],
    });
  }

  async findByCompetition(competitionId: string): Promise<Match[]> {
    return this.matchRepo.find({
      where: { competition_id: competitionId },
      relations: ['home_team', 'away_team'],
      order: { match_date: 'DESC', kickoff_time: 'ASC' },
    });
  }

  async findByTeam(teamId: string, limit = 5): Promise<Match[]> {
    return this.matchRepo.find({
      where: [
        { home_team_id: teamId },
        { away_team_id: teamId },
      ],
      relations: ['home_team', 'away_team', 'competition'],
      order: { match_date: 'DESC' },
      take: limit,
    });
  }

  async upsert(matchData: Partial<Match>): Promise<Match> {
    const existing = await this.matchRepo.findOne({
      where: { provider: matchData.provider, provider_id: matchData.provider_id },
    });
    if (existing) {
      await this.matchRepo.update(existing.id, matchData);
      return this.findById(existing.id)!;
    }
    const match = this.matchRepo.create(matchData);
    return this.matchRepo.save(match);
  }
}
