import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('ai_chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ChatSession, (s) => s.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;

  @Column({ name: 'session_id' })
  session_id: string;

  @Column({ type: 'varchar', length: 20 })
  role: string; // 'user' | 'assistant'

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'simple-json', nullable: true })
  sources: Array<{ type: string; table?: string; id?: string; field?: string; doc?: string; model?: string }>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model_version: string;

  @Column({ type: 'integer', nullable: true })
  tokens_used: number;

  @Column({ type: 'integer', nullable: true })
  confidence_score: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
