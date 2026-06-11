import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Player } from '../players/player.entity';
import { Team } from '../teams/team.entity';

@Entity('match_events')
export class MatchEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, (m) => m.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'match_id' })
  match_id: string;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ name: 'player_id', nullable: true })
  player_id: string;

  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'team_id' })
  team_id: string;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'related_player_id' })
  related_player: Player;

  @Column({ name: 'related_player_id', nullable: true })
  related_player_id: string;

  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ type: 'integer' })
  minute: number;

  @Column({ type: 'integer', nullable: true })
  extra_minute: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  comment: string;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, any>;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
