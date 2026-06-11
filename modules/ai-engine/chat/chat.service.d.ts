import { Repository } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { ChatMessage } from './chat-message.entity';
export declare class ChatService {
    private readonly sessionRepo;
    private readonly messageRepo;
    constructor(sessionRepo: Repository<ChatSession>, messageRepo: Repository<ChatMessage>);
    createSession(data: {
        userId: string;
        matchId?: string;
        title?: string;
    }): Promise<ChatSession>;
    addMessage(data: {
        sessionId: string;
        role: 'user' | 'assistant';
        message: string;
        sources?: any[];
        modelVersion?: string;
        tokensUsed?: number;
        confidenceScore?: number;
    }): Promise<ChatMessage>;
    getSession(sessionId: string): Promise<ChatSession | null>;
    getUserSessions(userId: string): Promise<ChatSession[]>;
    getMessages(sessionId: string): Promise<ChatMessage[]>;
}
//# sourceMappingURL=chat.service.d.ts.map