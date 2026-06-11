import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('players')
export class Player {
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
  position: string; // 'GK' | 'DF' | 'MF' | 'FW'

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  nationality_code: string;

  @Column({ type: 'date', nullable: true })
  birth_date: string;

  @Column({ type: 'integer', nullable: true })
  height_cm: number;

  @Column({ type: 'integer', nullable: true })
  weight_kg: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  preferred_foot: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo_url: string;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, any>;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
