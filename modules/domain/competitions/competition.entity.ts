import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Sport } from '../sports/sport.entity';
import { Season } from '../seasons/season.entity';
import { Match } from '../matches/match.entity';

@Entity('competitions')
export class Competition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sport, (s) => s.competitions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sport_id' })
  sport: Sport;

  @Column({ name: 'sport_id' })
  sport_id: string;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'integer' })
  provider_id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name_zh: string;

  @Column({ type: 'varchar', length: 20 })
  type: string; // 'tournament' | 'league' | 'cup'

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  country_code: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, any>;

  @OneToMany(() => Season, (s) => s.competition)
  seasons: Season[];

  @OneToMany(() => Match, (m) => m.competition)
  matches: Match[];

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
