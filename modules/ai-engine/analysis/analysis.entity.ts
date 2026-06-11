import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Match } from '../../domain/matches/match.entity';

@Entity('ai_analysis')
export class AiAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id', nullable: true })
  match_id: string;

  @Column({ name: 'team_id', nullable: true })
  team_id: string;

  @Column({ name: 'player_id', nullable: true })
  player_id: string;

  @Column({ type: 'varchar', length: 30 })
  analysis_type: string; // 'pre_match' | 'post_match' | 'team_deep' | 'player_deep'

  @Column({ type: 'simple-json' })
  content: Record<string, any>;

  @Column({ type: 'varchar', length: 50 })
  model_version: string;

  @Column({ type: 'simple-json' })
  input_context: Record<string, any>;

  @Column({ type: 'integer' })
  confidence_score: number;

  @Column({ type: 'integer', nullable: true })
  tokens_used: number;

  @Column({ type: 'datetime', default: () => "CURRENT_TIMESTAMP" })
  generated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date;

  @Column({ type: 'boolean', default: false })
  is_cached: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
