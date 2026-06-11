import { Repository } from 'typeorm';
import { Match } from './match.entity';
export declare class MatchesService {
    private readonly matchRepo;
    constructor(matchRepo: Repository<Match>);
    findById(id: string): Promise<Match | null>;
    findTodayMatches(): Promise<Match[]>;
    findByDate(date: string): Promise<Match[]>;
    findLiveMatches(): Promise<Match[]>;
    findByCompetition(competitionId: string): Promise<Match[]>;
    findByTeam(teamId: string, limit?: number): Promise<Match[]>;
    upsert(matchData: Partial<Match>): Promise<Match>;
}
//# sourceMappingURL=matches.service.d.ts.map