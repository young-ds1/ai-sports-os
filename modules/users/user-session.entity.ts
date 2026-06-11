import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  user_id: string;

  @Column({ type: 'datetime',  })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  ended_at: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  device: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
