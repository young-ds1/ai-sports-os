import { Sport } from '../sports/sport.entity';
import { Season } from '../seasons/season.entity';
import { Match } from '../matches/match.entity';
export declare class Competition {
    id: string;
    sport: Sport;
    sport_id: string;
    provider: string;
    provider_id: number;
    name: string;
    name_zh: string;
    type: string;
    country: string;
    country_code: string;
    logo_url: string;
    meta: Record<string, any>;
    seasons: Season[];
    matches: Match[];
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=competition.entity.d.ts.map