import { Repository } from 'typeorm';
import { Competition } from './competition.entity';
export declare class CompetitionsService {
    private readonly compRepo;
    constructor(compRepo: Repository<Competition>);
    findById(id: string): Promise<Competition | null>;
    findBySport(sportSlug: string): Promise<Competition[]>;
    getCurrentSeason(competitionId: string): Promise<any>;
    upsert(compData: Partial<Competition>): Promise<Competition>;
}
//# sourceMappingURL=competitions.service.d.ts.map