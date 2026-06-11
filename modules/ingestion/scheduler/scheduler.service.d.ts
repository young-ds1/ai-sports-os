import { MatchSyncService } from '../sync/match-sync.service';
export declare class SchedulerService {
    private readonly matchSync;
    private readonly logger;
    constructor(matchSync: MatchSyncService);
    syncFixtures(): Promise<void>;
    syncLiveMatches(): Promise<void>;
}
//# sourceMappingURL=scheduler.service.d.ts.map