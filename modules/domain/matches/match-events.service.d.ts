import { Repository } from 'typeorm';
import { MatchEvent } from './match-event.entity';
export declare class MatchEventsService {
    private readonly eventRepo;
    constructor(eventRepo: Repository<MatchEvent>);
    findByMatch(matchId: string): Promise<MatchEvent[]>;
    findByPlayer(playerId: string, limit?: number): Promise<MatchEvent[]>;
    upsert(eventData: Partial<MatchEvent>): Promise<MatchEvent>;
}
//# sourceMappingURL=match-events.service.d.ts.map