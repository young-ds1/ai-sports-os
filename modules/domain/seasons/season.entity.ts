import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Competition } from '../competitions/competition.entity';
import { Match } from '../matches/match.entity';

@Entity('seasons')
export class Season {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Competition, (c) => c.seasons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @Column({ name: 'competition_id' })
  competition_id: string;

  @Column({ type: 'varchar', length: 20 })
  name: string; // '2026' | '2026-27'

  @Column({ type: 'date', nullable: true })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'boolean', default: false })
  is_current: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  provider: string;

  @Column({ type: 'integer', nullable: true })
  provider_id: number;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, any>;

  @OneToMany(() => Match, (m) => m.season)
  matches: Match[];

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
