import { Match } from './match.entity';
import { Player } from '../players/player.entity';
import { Team } from '../teams/team.entity';
export declare class MatchEvent {
    id: string;
    match: Match;
    match_id: string;
    player: Player;
    player_id: string;
    team: Team;
    team_id: string;
    related_player: Player;
    related_player_id: string;
    type: string;
    minute: number;
    extra_minute: number;
    comment: string;
    meta: Record<string, any>;
    created_at: Date;
}
//# sourceMappingURL=match-event.entity.d.ts.map