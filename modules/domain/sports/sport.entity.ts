import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Competition } from '../competitions/competition.entity';

@Entity('sports')
export class Sport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name_zh: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon: string;

  @OneToMany(() => Competition, (c) => c.sport)
  competitions: Competition[];

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
