import { Team } from './team.entity';
import { Season } from '../seasons/season.entity';
import { Player } from '../players/player.entity';
export declare class TeamSeason {
    id: string;
    team: Team;
    team_id: string;
    season: Season;
    season_id: string;
    player: Player;
    player_id: string;
    shirt_number: number;
    position: string;
    is_loan: boolean;
    joined_at: string;
    left_at: string;
    created_at: Date;
}
//# sourceMappingURL=team-season.entity.d.ts.map