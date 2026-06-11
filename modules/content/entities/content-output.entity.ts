import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ContentTask } from './content-task.entity';

@Entity('content_outputs')
export class ContentOutput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ContentTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: ContentTask;

  @Column({ name: 'task_id' })
  task_id: string;

  @Column({ type: 'varchar', length: 30 })
  platform: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  @Column({ type: 'text' })
  content: string;  // Final formatted content ready to publish

  @Column({ type: 'varchar', length: 20, default: 'markdown' })
  format: string;  // 'markdown' | 'plain_text' | 'script' | 'thread'

  @Column({ type: 'simple-json', nullable: true })
  hashtags: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  utm_url: string;  // Tracked URL with UTM params

  @Column({ type: 'varchar', length: 100, nullable: true })
  content_id: string;  // Unique ID for cross-platform tracking

  // AI metadata
  @Column({ type: 'varchar', length: 50, nullable: true })
  model_version: string;

  @Column({ type: 'integer', nullable: true })
  tokens_used: number;

  @Column({ type: 'integer', nullable: true })
  confidence_score: number;

  @Column({ type: 'datetime',  })
  generated_at: Date;

  // Distribution tracking
  @Column({ type: 'datetime', nullable: true })
  published_at: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  published_url: string;

  // Engagement metrics (回填)
  @Column({ type: 'simple-json', nullable: true })
  engagement: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    clicks?: number;
    conversions?: number;  // Signed up via this content
  };

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
