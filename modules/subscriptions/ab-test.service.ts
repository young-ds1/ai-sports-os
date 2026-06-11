import { Injectable, Logger } from '@nestjs/common';

/**
 * ABTestService — splits Free users into control/variant groups
 * to measure whether Pro previews actually increase conversion.
 *
 * Groups:
 *   A (control)  — Standard Free experience, no upgrade prompts
 *   B (variant)  — Sees Pro preview teasers after premium questions
 *   C (variant2) — Sees preview BEFORE answering (aggressive upsell)
 *
 * Assignment: deterministic hash of user_id → consistent across sessions.
 */

export type TestGroup = 'A' | 'B' | 'C';

interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  groups: Record<TestGroup, {
    weight: number;          // % of users in this group
    showTeasers: boolean;    // Show "unlock Pro" previews?
    teaserTiming: 'after' | 'before' | 'never';
    freeLimitMultiplier: number;
  }>;
}

interface TestResult {
  experimentId: string;
  group: TestGroup;
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  avgQuestionsPerUser: number;
  avgSessionsPerUser: number;
}

@Injectable()
export class ABTestService {
  private readonly logger = new Logger(ABTestService.name);

  // Active experiment
  private readonly activeExperiment: ExperimentConfig = {
    id: 'exp_001_pro_teaser_june2026',
    name: 'Pro Teaser Effectiveness',
    description: 'Measure if showing Pro preview teasers increases conversion from Free to VIP/Pro',
    startDate: new Date('2026-06-12'),
    groups: {
      A: {
        weight: 50,         // 50% of users — control
        showTeasers: false,
        teaserTiming: 'never',
        freeLimitMultiplier: 1.0,
      },
      B: {
        weight: 35,         // 35% of users — after-question teaser
        showTeasers: true,
        teaserTiming: 'after',
        freeLimitMultiplier: 1.0,
      },
      C: {
        weight: 15,         // 15% of users — aggressive before-question
        showTeasers: true,
        teaserTiming: 'before',
        freeLimitMultiplier: 0.7, // Slightly lower free limit to test urgency
      },
    },
  };

  // Conversion tracking per group
  private conversionData: Record<TestGroup, {
    users: Set<string>;
    conversions: Set<string>;
    totalQuestions: number;
    totalSessions: number;
  }> = {
    A: { users: new Set(), conversions: new Set(), totalQuestions: 0, totalSessions: 0 },
    B: { users: new Set(), conversions: new Set(), totalQuestions: 0, totalSessions: 0 },
    C: { users: new Set(), conversions: new Set(), totalQuestions: 0, totalSessions: 0 },
  };

  /**
   * Assign a user to an experiment group.
   * Deterministic — same user always gets same group.
   */
  assignGroup(userId: string): TestGroup {
    // Simple hash-based assignment
    const hash = this.hashString(userId);
    const percentile = hash % 100;

    let cumulative = 0;
    for (const [group, config] of Object.entries(this.activeExperiment.groups)) {
      cumulative += config.weight;
      if (percentile < cumulative) {
        this.conversionData[group as TestGroup].users.add(userId);
        return group as TestGroup;
      }
    }

    return 'A'; // Fallback to control
  }

  /**
   * Check if teasers should be shown to this user.
   */
  shouldShowTeasers(userId: string): { show: boolean; timing: 'after' | 'before' | 'never' } {
    const group = this.assignGroup(userId);
    const config = this.activeExperiment.groups[group];
    return { show: config.showTeasers, timing: config.teaserTiming };
  }

  /**
   * Get the effective free limit multiplier for this user.
   */
  getFreeLimitMultiplier(userId: string): number {
    const group = this.assignGroup(userId);
    return this.activeExperiment.groups[group].freeLimitMultiplier;
  }

  /**
   * Track a user action for the experiment.
   */
  trackAction(userId: string, action: 'question' | 'session'): void {
    const group = this.assignGroup(userId);
    if (action === 'question') this.conversionData[group].totalQuestions++;
    if (action === 'session') this.conversionData[group].totalSessions++;
  }

  /**
   * Track a conversion (user upgrades from Free).
   */
  trackConversion(userId: string): void {
    const group = this.assignGroup(userId);
    this.conversionData[group].conversions.add(userId);
    this.logger.log(`[ABTest] Conversion: user=${userId.substring(0, 8)} group=${group}`);
  }

  /**
   * Get experiment results.
   */
  getResults(): { experiment: ExperimentConfig; results: TestResult[] } {
    const results: TestResult[] = [];

    for (const [group, data] of Object.entries(this.conversionData)) {
      const totalUsers = data.users.size;
      const conversions = data.conversions.size;
      results.push({
        experimentId: this.activeExperiment.id,
        group: group as TestGroup,
        totalUsers,
        conversions,
        conversionRate: totalUsers > 0 ? conversions / totalUsers : 0,
        avgQuestionsPerUser: totalUsers > 0 ? data.totalQuestions / totalUsers : 0,
        avgSessionsPerUser: totalUsers > 0 ? data.totalSessions / totalUsers : 0,
      });
    }

    return { experiment: this.activeExperiment, results };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
