import { ProviderRouterService } from '../router/provider-router.service';
import { MatchesService } from '../../domain/matches/matches.service';
import { TeamsService } from '../../domain/teams/teams.service';
export declare class MatchSyncService {
    private readonly router;
    private readonly matchesService;
    private readonly teamsService;
    private readonly logger;
    constructor(router: ProviderRouterService, matchesService: MatchesService, teamsService: TeamsService);
    syncFixtures(provider: string, date: string): Promise<void>;
    syncLiveMatches(provider: string): Promise<void>;
}
//# sourceMappingURL=match-sync.service.d.ts.map