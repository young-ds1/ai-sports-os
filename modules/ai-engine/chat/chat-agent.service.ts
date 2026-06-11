import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class ChatAgentService {
  private readonly logger = new Logger(ChatAgentService.name);

  constructor(
    private readonly matchesService: MatchesService,
    private readonly playersService: PlayersService,
    private readonly cacheService: AiCacheService,
    private readonly openai: OpenaiService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly tracer: SourceTracerService,
  ) {}

  async answer(userMessage: string, context: ChatContext): Promise<ChatResponse> {
    // Step 1: Query the database for factual data
    const dbResult = await this.queryDatabase(userMessage, context);
    if (dbResult) {
      return { message: dbResult.answer, sources: dbResult.sources, confidence: 95 };
    }

    // Step 2: Check AI analysis cache
    if (context.matchId) {
      const cached = await this.cacheService.getAnalysis(context.matchId);
      if (cached) {
        return {
          message: `根据已有的AI分析：${cached.summary || JSON.stringify(cached).substring(0, 500)}`,
          sources: [this.tracer.cacheSource(context.matchId)],
          confidence: 80,
        };
      }
    }

    // Step 3: LLM inference (last resort)
    const dbContext = await this.buildContext(context);
    const prompt = this.promptBuilder.buildChatPrompt(userMessage, dbContext);
    const llm = await this.openai.chat([
      { role: 'system', content: 'You are an expert sports analyst. Be accurate and honest.' },
      { role: 'user', content: prompt },
    ]);

    return {
      message: llm.answer,
      sources: [this.tracer.llmSource(llm.model)],
      confidence: 60,
    };
  }

  /**
   * Query the domain database for factual answers.
   * Returns null if the question requires reasoning beyond DB lookup.
   */
  private async queryDatabase(
    message: string,
    context: ChatContext,
  ): Promise<{ answer: string; sources: Source[] } | null> {
    const msg = message.toLowerCase();

    // "How many goals did X score?" → match_events
    if (msg.includes('进球') || msg.includes('goal') || msg.includes('score')) {
      if (context.matchId) {
        const match = await this.matchesService.findById(context.matchId);
        if (match) {
          const goalEvents = match.events?.filter(e => e.type === 'goal' || e.type === 'penalty_goal') || [];
          if (goalEvents.length > 0) {
            const summary = goalEvents
              .map(e => `${e.minute}' ${e.comment}`)
              .join('；');
            return {
              answer: `本场比赛共 ${goalEvents.length} 个进球：${summary}`,
              sources: [this.tracer.dbSource('match_events')],
            };
          }
          return {
            answer: `本场比赛目前没有进球事件。比分为 ${match.home_team?.name || '主队'} ${match.home_score || 0} - ${match.away_score || 0} ${match.away_team?.name || '客队'}`,
            sources: [this.tracer.dbSource('matches', 'home_score')],
          };
        }
      }
    }

    // "What's the score?" → matches
    if (msg.includes('比分') || msg.includes('几比几') || msg.includes('score')) {
      if (context.matchId) {
        const match = await this.matchesService.findById(context.matchId);
        if (match) {
          return {
            answer: `${match.home_team?.name || '主队'} ${match.home_score || 0} - ${match.away_score || 0} ${match.away_team?.name || '客队'}（${match.status === 'live' ? `进行中 ${match.elapsed_minute}'` : match.status === 'finished' ? '已结束' : '未开始'}）`,
            sources: [this.tracer.dbSource('matches', 'home_score,away_score,status')],
          };
        }
      }
    }

    // "What matches today?" → matches
    if (msg.includes('今天') || msg.includes('今日') || msg.includes('today')) {
      const today = new Date().toISOString().split('T')[0];
      const matches = await this.matchesService.findByDate(today);
      if (matches.length > 0) {
        const list = matches
          .map(m => `• ${m.home_team?.name || '?'} vs ${m.away_team?.name || '?'} — ${m.kickoff_time || 'TBD'} (${m.status})`)
          .join('\n');
        return {
          answer: `今天共有 ${matches.length} 场比赛：\n${list}`,
          sources: [this.tracer.dbSource('matches')],
        };
      }
      return {
        answer: '今天暂无比赛安排。',
        sources: [this.tracer.dbSource('matches')],
      };
    }

    return null; // Requires LLM reasoning
  }

  private async buildContext(context: ChatContext): Promise<string> {
    const parts: string[] = [];

    if (context.matchId) {
      const match = await this.matchesService.findById(context.matchId);
      if (match) {
        parts.push(`MATCH: ${match.home_team?.name} ${match.home_score || 0}-${match.away_score || 0} ${match.away_team?.name}`);
        parts.push(`COMPETITION: ${match.competition?.name}`);
        parts.push(`STATUS: ${match.status}`);
        parts.push(`VENUE: ${match.venue || 'Unknown'}`);
        const goals = match.events?.filter(e => e.type === 'goal') || [];
        parts.push(`GOALS: ${goals.map(g => `${g.minute}' ${g.comment}`).join(', ') || 'None'}`);
        parts.push(`STATS: ${JSON.stringify(match.stats_summary || {})}`);
      }
    }

    // Fallback: today's matches
    if (parts.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const matches = await this.matchesService.findByDate(today);
      parts.push(`TODAY'S MATCHES: ${matches.length} matches scheduled`);
    }

    return parts.join('\n');
  }
}
