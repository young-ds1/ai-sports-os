import { PlayersService } from '../../../../modules/domain/players/players.service';
import { MatchEventsService } from '../../../../modules/domain/matches/match-events.service';
export declare class PlayerController {
    private readonly playersService;
    private readonly matchEventsService;
    constructor(playersService: PlayersService, matchEventsService: MatchEventsService);
    findById(id: string): Promise<{
        error: string;
        id?: undefined;
        name?: undefined;
        name_zh?: undefined;
        position?: undefined;
        nationality?: undefined;
        birth_date?: undefined;
        photo_url?: undefined;
        preferred_foot?: undefined;
        recent_events?: undefined;
    } | {
        id: string;
        name: string;
        name_zh: string;
        position: string;
        nationality: string;
        birth_date: string;
        photo_url: string;
        preferred_foot: string;
        recent_events: {
            type: string;
            minute: number;
            comment: string;
            match_id: string;
        }[];
        error?: undefined;
    }>;
}
//# sourceMappingURL=player.controller.d.ts.map