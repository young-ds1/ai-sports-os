import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany,
} from 'typeorm';

// Content trigger sources
export enum ContentTrigger {
  MATCH_FINISHED = 'match_finished',       // 赛后复盘
  MATCH_SCHEDULED = 'match_scheduled',     // 赛前预热
  PLAYER_MILESTONE = 'player_milestone',   // 球员里程碑（帽子戏法等）
  DAILY_DIGEST = 'daily_digest',           // 每日精选
  TRENDING_TOPIC = 'trending_topic',       // 热点事件
  MANUAL = 'manual',                       // 后台手动
}

export enum ContentType {
  PRE_MATCH = 'pre_match',           // 赛前分析
  POST_MATCH = 'post_match',         // 赛后复盘
  PLAYER_SPOTLIGHT = 'player_spotlight',  // 球员聚焦
  TEAM_DEEP_DIVE = 'team_deep_dive',      // 球队深度
  HOT_TAKE = 'hot_take',             // 热点评论
  RANKING = 'ranking',               // 排名/榜单
  FUN_FACT = 'fun_fact',             // 趣味数据
}

export enum ContentStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PUBLISHED = 'published',
}

@Entity('content_tasks')
export class ContentTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  trigger_type: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  reference_type: string;  // 'match' | 'team' | 'player'

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ type: 'varchar', length: 30 })
  content_type: string;

  @Column({ type: 'simple-json' })
  target_platforms: string[];  // ['xiaohongshu', 'twitter', 'wechat', 'douyin', 'seo']

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  priority: number;

  // Context for AI generation
  @Column({ type: 'simple-json', nullable: true })
  input_context: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model_version: string;

  @Column({ type: 'integer', nullable: true })
  total_tokens_used: number;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
