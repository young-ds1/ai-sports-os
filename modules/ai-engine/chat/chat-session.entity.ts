import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { Match } from '../../domain/matches/match.entity';

@Entity('ai_chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => Match, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id', nullable: true })
  match_id: string;

  @Column({ name: 'team_id', nullable: true })
  team_id: string;

  @Column({ name: 'player_id', nullable: true })
  player_id: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  title: string;

  @Column({ type: 'integer', default: 0 })
  message_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => ChatMessage, (m) => m.session)
  messages: ChatMessage[];

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
