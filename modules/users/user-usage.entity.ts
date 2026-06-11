import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_usage')
export class UserUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ name: 'session_id', nullable: true })
  session_id: string;

  @Column({ type: 'varchar', length: 30 })
  action: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  entity_type: string;

  @Column({ name: 'entity_id', nullable: true })
  entity_id: string;

  @Column({ type: 'integer', nullable: true })
  latency_ms: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
