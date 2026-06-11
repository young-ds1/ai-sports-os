import { ChatMessage } from './chat-message.entity';
import { Match } from '../../domain/matches/match.entity';
export declare class ChatSession {
    id: string;
    user_id: string;
    match: Match;
    match_id: string;
    team_id: string;
    player_id: string;
    title: string;
    message_count: number;
    is_active: boolean;
    messages: ChatMessage[];
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=chat-session.entity.d.ts.map