import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'integer' })
  provider_id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name_zh: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  short_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  country_code: string;

  @Column({ type: 'varchar', length: 20, default: 'national' })
  type: string; // 'national' | 'club' | 'esports_org'

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  venue: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  coach: string;

  @Column({ type: 'integer', nullable: true })
  founded: number;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, any>;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
