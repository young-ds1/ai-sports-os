import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Competition } from '../competitions/competition.entity';
import { Season } from '../seasons/season.entity';
import { Team } from '../teams/team.entity';
import { MatchEvent } from './match-event.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'integer' })
  provider_id: number;

  @ManyToOne(() => Competition, (c) => c.matches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @Column({ name: 'competition_id' })
  competition_id: string;

  @ManyToOne(() => Season, (s) => s.matches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @Column({ name: 'season_id' })
  season_id: string;

  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'home_team_id' })
  home_team: Team;

  @Column({ name: 'home_team_id' })
  home_team_id: string;

  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'away_team_id' })
  away_team: Team;

  @Column({ name: 'away_team_id' })
  away_team_id: string;

  // Timeline
  @Column({ type: 'date' })
  match_date: string;

  @Column({ type: 'time', nullable: true })
  kickoff_time: string;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: string;

  @Column({ type: 'integer', nullable: true })
  elapsed_minute: number;

  // Scores
  @Column({ type: 'integer', nullable: true })
  home_score: number;

  @Column({ type: 'integer', nullable: true })
  away_score: number;

  @Column({ type: 'integer', nullable: true })
  home_ht_score: number;

  @Column({ type: 'integer', nullable: true })
  away_ht_score: number;

  @Column({ type: 'integer', nullable: true })
  home_et_score: number;

  @Column({ type: 'integer', nullable: true })
  away_et_score: number;

  @Column({ type: 'integer', nullable: true })
  home_penalty: number;

  @Column({ type: 'integer', nullable: true })
  away_penalty: number;

  // Tournament structure
  @Column({ type: 'varchar', length: 200, nullable: true })
  round: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  group_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  knockout_stage: string;

  // Venue
  @Column({ type: 'varchar', length: 200, nullable: true })
  venue: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'integer', nullable: true })
  attendance: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  referee: string;

  @Column({ type: 'simple-json', nullable: true })
  stats_summary: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, any>;

  @OneToMany(() => MatchEvent, (e) => e.match)
  events: MatchEvent[];

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
