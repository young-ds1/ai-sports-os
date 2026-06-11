import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { Season } from '../seasons/season.entity';
import { Player } from '../players/player.entity';

@Entity('team_seasons')
export class TeamSeason {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'team_id' })
  team_id: string;

  @ManyToOne(() => Season, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @Column({ name: 'season_id' })
  season_id: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Column({ name: 'player_id' })
  player_id: string;

  @Column({ type: 'integer', nullable: true })
  shirt_number: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  position: string;

  @Column({ type: 'boolean', default: false })
  is_loan: boolean;

  @Column({ type: 'date', nullable: true })
  joined_at: string;

  @Column({ type: 'date', nullable: true })
  left_at: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
