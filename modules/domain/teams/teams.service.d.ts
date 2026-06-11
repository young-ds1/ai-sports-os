import { Repository } from 'typeorm';
import { Team } from './team.entity';
export declare class TeamsService {
    private readonly teamRepo;
    constructor(teamRepo: Repository<Team>);
    findById(id: string): Promise<Team | null>;
    findByCompetition(competitionId: string): Promise<Team[]>;
    upsert(teamData: Partial<Team>): Promise<Team>;
}
//# sourceMappingURL=teams.service.d.ts.map