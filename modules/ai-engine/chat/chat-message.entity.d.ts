import { ChatSession } from './chat-session.entity';
export declare class ChatMessage {
    id: string;
    session: ChatSession;
    session_id: string;
    role: string;
    message: string;
    sources: Array<{
        type: string;
        table?: string;
        id?: string;
        field?: string;
        doc?: string;
        model?: string;
    }>;
    model_version: string;
    tokens_used: number;
    confidence_score: number;
    created_at: Date;
}
//# sourceMappingURL=chat-message.entity.d.ts.map