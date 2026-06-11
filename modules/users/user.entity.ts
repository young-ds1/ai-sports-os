import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  supabase_uid: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', length: 20, default: 'free' })
  tier: string;

  @Column({ type: 'datetime', nullable: true })
  tier_expires_at: Date;

  @Column({ type: 'integer', default: 3 })
  daily_limit: number;

  @Column({ type: 'varchar', length: 10, default: 'zh' })
  lang: string;

  // ── Traffic source (STEP X: Market Validation) ──
  @Column({ type: 'varchar', length: 50, nullable: true })
  traffic_source: string;    // utm_source: xiaohongshu | twitter | wechat | douyin | seo | direct

  @Column({ type: 'varchar', length: 100, nullable: true })
  campaign: string;          // utm_campaign: post_match_2026-06-12

  @Column({ type: 'varchar', length: 200, nullable: true })
  landing_page: string;      // /matches/match-003 or /

  @Column({ type: 'datetime', nullable: true })
  first_seen_at: Date;       // First visit timestamp

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;
}
