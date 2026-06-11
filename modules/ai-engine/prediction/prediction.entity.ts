import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Match } from '../../domain/matches/match.entity';

@Entity('ai_predictions')
export class AiPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id' })
  match_id: string;

  @Column({ type: 'simple-json' })
  prediction: Record<string, any>;

  @Column({ type: 'varchar', length: 50 })
  model_version: string;

  @Column({ type: 'simple-json' })
  input_context: Record<string, any>;

  @Column({ type: 'integer' })
  confidence_score: number;

  @Column({ type: 'integer', nullable: true })
  tokens_used: number;

  @Column({ type: 'datetime',  })
  generated_at: Date;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'boolean', nullable: true })
  is_correct: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  actual_result: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
