import { Injectable } from '@nestjs/common';
import { HotScoreResult } from '../signals/hot-score.service';

/**
 * HookOptimizer — learns which content patterns drive the highest CTR/engagement.
 * Feeds winning patterns back into the AI prompt for better content.
 *
 * This is a simplified learning system. Phase 4+ should use actual A/B test data.
 */

interface HookPattern {
  id: string;
  platform: string;
  pattern: string;         // The hook pattern description
  example: string;         // Example of this pattern
  avgCtr: number;          // Average click-through rate
  avgEngagement: number;   // Average engagement score
  useCount: number;        // How many times this pattern has been used
  lastUsedAt: Date;
}

interface EnhancementResult {
  originalLength: number;
  enhancedLength: number;
  hooksApplied: string[];
}

@Injectable()
export class HookOptimizerService {
  // Seed patterns with sports content best practices
  private patterns: HookPattern[] = [
    {
      id: 'hot-take',
      platform: 'all',
      pattern: 'Bold controversial take — "X team exposed Y weakness"',
      example: '德国3-3西班牙暴露了传控足球的致命缺陷',
      avgCtr: 0.045,
      avgEngagement: 120,
      useCount: 50,
      lastUsedAt: new Date(),
    },
    {
      id: 'numbers-first',
      platform: 'all',
      pattern: 'Lead with a shocking number/stat',
      example: '6个进球、2次扳平、1张红牌——这场比赛浓缩了世界杯的一切',
      avgCtr: 0.052,
      avgEngagement: 145,
      useCount: 65,
      lastUsedAt: new Date(),
    },
    {
      id: 'question-hook',
      platform: 'xiaohongshu',
      pattern: 'Open with an irresistible question',
      example: '为什么德国队3次领先都没赢下比赛？',
      avgCtr: 0.038,
      avgEngagement: 95,
      useCount: 40,
      lastUsedAt: new Date(),
    },
    {
      id: 'thread-tease',
      platform: 'twitter',
      pattern: 'Tease a deep insight in first tweet, deliver in thread',
      example: "Germany 3-3 Spain. 6 goals, but the REAL story is what happened in midfield. 🧵",
      avgCtr: 0.061,
      avgEngagement: 210,
      useCount: 55,
      lastUsedAt: new Date(),
    },
    {
      id: 'emoji-story',
      platform: 'xiaohongshu',
      pattern: 'Use emojis to tell the story arc visually',
      example: '🇩🇪⚽⚽⚽ vs 🇪🇸⚽⚽⚽ → 这场比赛太刺激了！',
      avgCtr: 0.041,
      avgEngagement: 88,
      useCount: 35,
      lastUsedAt: new Date(),
    },
    {
      id: 'data-drop',
      platform: 'wechat',
      pattern: 'Open with a surprising data point that reframes the match',
      example: '西班牙本场传球成功率91%——但德国用48%的控球率打进了3个球。效率革命？',
      avgCtr: 0.049,
      avgEngagement: 160,
      useCount: 30,
      lastUsedAt: new Date(),
    },
    {
      id: 'before-after',
      platform: 'douyin',
      pattern: '3-second transformation: "Nobody expected THIS"',
      example: '赛前：德国稳了 → 第41分钟：悬念回来了 → 第88分钟：疯了',
      avgCtr: 0.055,
      avgEngagement: 180,
      useCount: 25,
      lastUsedAt: new Date(),
    },
    {
      id: 'listicle-hook',
      platform: 'seo',
      pattern: '"X things we learned from [match]" — listicle format',
      example: '德国3-3西班牙：我们学到的5件事',
      avgCtr: 0.035,
      avgEngagement: 75,
      useCount: 20,
      lastUsedAt: new Date(),
    },
  ];

  /**
   * Get the best-performing hook patterns sorted by CTR.
   */
  getBestPatterns(limit = 3): HookPattern[] {
    return [...this.patterns]
      .sort((a, b) => b.avgCtr - a.avgCtr)
      .slice(0, limit);
  }

  /**
   * Get best patterns for a specific platform.
   */
  getBestForPlatform(platform: string, limit = 3): HookPattern[] {
    return [...this.patterns]
      .filter(p => p.platform === platform || p.platform === 'all')
      .sort((a, b) => b.avgCtr - a.avgCtr)
      .slice(0, limit);
  }

  /**
   * Enhance content body by applying platform-specific hook optimizations.
   */
  enhance(platform: string, body: string, signal?: HotScoreResult): string {
    const enhancements: string[] = [];
    let enhanced = body;

    // Apply the top pattern for this platform
    const bestPatterns = this.getBestForPlatform(platform, 1);
    if (bestPatterns.length > 0) {
      const pattern = bestPatterns[0];
      enhancements.push(pattern.id);

      // If the body doesn't already start with a number (for numbers-first pattern)
      if (pattern.id === 'numbers-first' && !/^\d/.test(body.trim())) {
        const totalGoals = (signal as any)?.matchData?.totalGoals;
        if (totalGoals && totalGoals >= 4) {
          enhanced = `${totalGoals}个进球！${body.substring(0, 200)}`;
        }
      }

      // Ensure the content ends with discussion spark
      if (platform === 'xiaohongshu' || platform === 'twitter') {
        if (!enhanced.includes('？') && !enhanced.includes('?')) {
          enhanced += '\n\n你怎么看？';
        }
      }
    }

    return enhanced;
  }

  /**
   * Record engagement data to update pattern performance.
   * This closes the feedback loop — patterns that drive CTR get used more.
   */
  recordEngagement(
    patternId: string,
    metrics: { ctr: number; engagement: number },
  ): void {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    // Rolling average update
    const alpha = 0.3; // Weight for new data
    pattern.avgCtr = pattern.avgCtr * (1 - alpha) + metrics.ctr * alpha;
    pattern.avgEngagement = Math.round(
      pattern.avgEngagement * (1 - alpha) + metrics.engagement * alpha,
    );
    pattern.useCount++;
    pattern.lastUsedAt = new Date();
  }

  /**
   * Get all patterns with performance data (for growth dashboard).
   */
  getAllPatterns(): HookPattern[] {
    return [...this.patterns].sort((a, b) => b.avgCtr - a.avgCtr);
  }
}
