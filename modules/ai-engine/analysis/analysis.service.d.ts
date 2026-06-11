import { Repository } from 'typeorm';
import { AiAnalysis } from './analysis.entity';
export declare class AnalysisService {
    private readonly analysisRepo;
    constructor(analysisRepo: Repository<AiAnalysis>);
    getByMatch(matchId: string): Promise<AiAnalysis | null>;
    create(data: Partial<AiAnalysis>): Promise<AiAnalysis>;
    getByTeam(teamId: string): Promise<AiAnalysis[]>;
    invalidateCache(matchId: string): Promise<void>;
}
//# sourceMappingURL=analysis.service.d.ts.map