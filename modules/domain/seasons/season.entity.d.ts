import { Competition } from '../competitions/competition.entity';
import { Match } from '../matches/match.entity';
export declare class Season {
    id: string;
    competition: Competition;
    competition_id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    provider: string;
    provider_id: number;
    meta: Record<string, any>;
    matches: Match[];
    created_at: Date;
}
//# sourceMappingURL=season.entity.d.ts.map