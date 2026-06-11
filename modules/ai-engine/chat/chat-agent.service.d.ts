import { MatchesService } from '../../domain/matches/matches.service';
import { PlayersService } from '../../domain/players/players.service';
import { AiCacheService } from '../cache/ai-cache.service';
import { OpenaiService } from '../engines/openai.service';
import { PromptBuilderService } from '../engines/prompt-builder.service';
import { SourceTracerService, Source } from '../engines/source-tracer.service';
export interface ChatContext {
    matchId?: string;
    teamId?: string;
    playerId?: string;
}
export interface ChatResponse {
    message: string;
    sources: Source[];
    confidence: number;
}
export declare class ChatAgentService {
    private readonly matchesService;
    private readonly playersService;
    private readonly cacheService;
    private readonly openai;
    private readonly promptBuilder;
    private readonly tracer;
    private readonly logger;
    constructor(matchesService: MatchesService, playersService: PlayersService, cacheService: AiCacheService, openai: OpenaiService, promptBuilder: PromptBuilderService, tracer: SourceTracerService);
    answer(userMessage: string, context: ChatContext): Promise<ChatResponse>;
    /**
     * Query the domain database for factual answers.
     * Returns null if the question requires reasoning beyond DB lookup.
     */
    private queryDatabase;
    private buildContext;
}
//# sourceMappingURL=chat-agent.service.d.ts.map