import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition } from './competition.entity';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(Competition)
    private readonly compRepo: Repository<Competition>,
  ) {}

  async findById(id: string): Promise<Competition | null> {
    return this.compRepo.findOne({ where: { id }, relations: ['sport', 'seasons'] });
  }

  async findBySport(sportSlug: string): Promise<Competition[]> {
    return this.compRepo
      .createQueryBuilder('comp')
      .innerJoin('comp.sport', 'sport')
      .where('sport.slug = :slug', { slug: sportSlug })
      .getMany();
  }

  async getCurrentSeason(competitionId: string) {
    return this.compRepo
      .createQueryBuilder('comp')
      .innerJoinAndSelect('comp.seasons', 'season')
      .where('comp.id = :id', { id: competitionId })
      .andWhere('season.is_current = TRUE')
      .getOne();
  }

  async upsert(compData: Partial<Competition>): Promise<Competition> {
    const existing = await this.compRepo.findOne({
      where: { provider: compData.provider, provider_id: compData.provider_id },
    });
    if (existing) {
      await this.compRepo.update(existing.id, compData);
      return this.findById(existing.id)!;
    }
    const comp = this.compRepo.create(compData);
    return this.compRepo.save(comp);
  }
}
