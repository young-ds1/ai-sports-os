import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { ChatMessage } from './chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  async createSession(data: {
    userId: string;
    matchId?: string;
    title?: string;
  }): Promise<ChatSession> {
    const session = this.sessionRepo.create({
      user_id: data.userId,
      match_id: data.matchId || null,
      title: data.title || '新对话',
      message_count: 0,
    });
    return this.sessionRepo.save(session);
  }

  async addMessage(data: {
    sessionId: string;
    role: 'user' | 'assistant';
    message: string;
    sources?: any[];
    modelVersion?: string;
    tokensUsed?: number;
    confidenceScore?: number;
  }): Promise<ChatMessage> {
    const msg = this.messageRepo.create({
      session_id: data.sessionId,
      role: data.role,
      message: data.message,
      sources: data.sources || [],
      model_version: data.modelVersion,
      tokens_used: data.tokensUsed,
      confidence_score: data.confidenceScore,
    });

    const saved = await this.messageRepo.save(msg);

    // Update message count
    await this.sessionRepo.increment({ id: data.sessionId }, 'message_count', 1);
    await this.sessionRepo.update(data.sessionId, { updated_at: new Date() });

    return saved;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['messages'],
    });
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return this.sessionRepo.find({
      where: { user_id: userId, is_active: true },
      order: { updated_at: 'DESC' },
      take: 20,
    });
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.messageRepo.find({
      where: { session_id: sessionId },
      order: { created_at: 'ASC' },
    });
  }
}
