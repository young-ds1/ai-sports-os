import { Injectable } from '@nestjs/common';

/**
 * UpgradePathService — designs the graduated value discovery that
 * leads Free users naturally toward Pro, and Pro to Elite.
 *
 * Psychology: Users don't upgrade because they're told to.
 * They upgrade because they hit a wall where the next tier
 * is OBVIOUSLY worth it.
 *
 * Three upgrade paths:
 * 1. Limit Wall    → "You've used 3/3 analyses. Pro = unlimited."
 * 2. Insight Gap   → "You know WHAT happened. Pro tells you WHY."
 * 3. Decision Need → "关键比赛，别靠猜。Pro 的预测帮你做判断。"
 */

export interface UpgradePathStatus {
  userId: string;
  currentTier: string;
  paths: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;      // 0-100, how close to triggering this path
    triggered: boolean;    // Should we show the upgrade prompt now?
    triggerReason: string;
    nextTier: string;
  }>;
  recommendedNextTier: string | null;
  urgencyLevel: 'none' | 'low' | 'medium' | 'high';
}

@Injectable()
export class UpgradePathService {
  /**
   * Evaluate a user's upgrade readiness across all paths.
   */
  evaluate(userId: string, context: {
    tier: string;
    todayAnalysisCount: number;
    dailyLimit: number;
    consecutiveQuestions: number;
    hasAskedPrediction: boolean;
    hasViewedKeyMatch: boolean;
    streak: number;
  }): UpgradePathStatus {
    if (context.tier === 'pro') {
      return {
        userId, currentTier: 'pro',
        paths: [], recommendedNextTier: null, urgencyLevel: 'none',
      };
    }

    const paths = [
      this.evaluateLimitWall(context),
      this.evaluateInsightGap(context),
      this.evaluateDecisionNeed(context),
    ].filter(Boolean) as UpgradePathStatus['paths'];

    const triggered = paths.filter(p => p.triggered);
    const urgency = triggered.length >= 2 ? 'high'
      : triggered.length === 1 ? 'medium'
      : paths.some(p => p.progress >= 50) ? 'low'
      : 'none';

    return {
      userId,
      currentTier: context.tier,
      paths,
      recommendedNextTier: triggered.length > 0
        ? (context.tier === 'free' ? 'pro' : 'elite')
        : null,
      urgencyLevel: urgency,
    };
  }

  private evaluateLimitWall(ctx: any) {
    const progress = Math.min(100, Math.round((ctx.todayAnalysisCount / ctx.dailyLimit) * 100));
    return {
      id: 'limit_wall',
      name: '用量限制',
      description: `今日已用 ${ctx.todayAnalysisCount}/${ctx.dailyLimit} 次分析`,
      progress,
      triggered: ctx.todayAnalysisCount >= ctx.dailyLimit,
      triggerReason: ctx.todayAnalysisCount >= ctx.dailyLimit
        ? '今日分析次数已用完。升级 Pro 畅享 50 次/天。'
        : `还差 ${ctx.dailyLimit - ctx.todayAnalysisCount} 次触达上限`,
      nextTier: 'pro',
    };
  }

  private evaluateInsightGap(ctx: any) {
    const progress = ctx.consecutiveQuestions >= 3 ? 100
      : ctx.consecutiveQuestions >= 2 ? 66
      : ctx.consecutiveQuestions >= 1 ? 33 : 0;
    return {
      id: 'insight_gap',
      name: '深度需求',
      description: `已连续提问 ${ctx.consecutiveQuestions} 次`,
      progress,
      triggered: ctx.consecutiveQuestions >= 3 && ctx.hasAskedPrediction,
      triggerReason: '你追问了很多深度问题。Pro 解锁战术拆解 + 球员评分。',
      nextTier: 'pro',
    };
  }

  private evaluateDecisionNeed(ctx: any) {
    const progress = ctx.hasAskedPrediction ? 80 : ctx.hasViewedKeyMatch ? 50 : ctx.streak >= 3 ? 30 : 0;
    return {
      id: 'decision_need',
      name: '决策需求',
      description: ctx.hasAskedPrediction ? '已询问预测类问题' : '持续关注比赛',
      progress,
      triggered: ctx.hasAskedPrediction && ctx.streak >= 3,
      triggerReason: '你关注关键比赛且需要预测。Pro 帮你做判断，不只是看数据。',
      nextTier: 'pro',
    };
  }
}
