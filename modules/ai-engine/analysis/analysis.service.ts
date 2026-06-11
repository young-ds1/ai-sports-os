import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAnalysis } from './analysis.entity';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(AiAnalysis)
    private readonly analysisRepo: Repository<AiAnalysis>,
  ) {}

  async getByMatch(matchId: string): Promise<AiAnalysis | null> {
    return this.analysisRepo.findOne({
      where: { match_id: matchId },
      order: { generated_at: 'DESC' },
    });
  }

  async create(data: Partial<AiAnalysis>): Promise<AiAnalysis> {
    const analysis = this.analysisRepo.create(data);
    return this.analysisRepo.save(analysis);
  }

  async getByTeam(teamId: string): Promise<AiAnalysis[]> {
    return this.analysisRepo.find({
      where: { team_id: teamId },
      order: { generated_at: 'DESC' },
      take: 5,
    });
  }

  async invalidateCache(matchId: string): Promise<void> {
    await this.analysisRepo.update(
      { match_id: matchId },
      { expires_at: new Date() }, // expire now
    );
  }
}
