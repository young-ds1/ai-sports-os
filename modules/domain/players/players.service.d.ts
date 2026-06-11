import { Repository } from 'typeorm';
import { Player } from './player.entity';
export declare class PlayersService {
    private readonly playerRepo;
    constructor(playerRepo: Repository<Player>);
    findById(id: string): Promise<Player | null>;
    findByTeam(teamId: string, seasonId: string): Promise<Player[]>;
    upsert(playerData: Partial<Player>): Promise<Player>;
}
//# sourceMappingURL=players.service.d.ts.map