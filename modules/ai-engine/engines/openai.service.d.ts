export declare class OpenaiService {
    private readonly logger;
    private client;
    constructor();
    chat(messages: {
        role: 'system' | 'user' | 'assistant';
        content: string;
    }[], options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }): Promise<{
        answer: string;
        model: string;
        tokensUsed: number;
    }>;
    private mockResponse;
}
//# sourceMappingURL=openai.service.d.ts.map