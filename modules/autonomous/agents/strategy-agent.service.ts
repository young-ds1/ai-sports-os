import { Injectable, Logger } from '@nestjs/common';
import { HotScoreService } from '../../content/signals/hot-score.service';
import { SignalRankerService } from '../../content/signals/signal-ranker.service';
import { RetentionEngineService } from '../../revenue/retention-engine.service';
import { RevenueFlywheelService } from '../../revenue/revenue-flywheel.service';
import { MatchesService } from '../../domain/matches/matches.service';

/**
 * StrategyAgent — the brain of the autonomous system.
 *
 * Makes decisions without human input:
 * - Which matches to cover today?
 * - What content types to prioritize?
 * - Where to allocate growth budget?
 * - What's the #1 bottleneck right now?
 *
 * Decision principle: MAXIMIZE next-week projected MRR.
 * All strategy decisions flow from "what will increase revenue next week?"
 */

export interface StrategyDecision {
  timestamp: Date;
  cycle: number;
  // Top-level direction
  primaryObjective: string;          // "grow_dau" | "increase_conversion" | "reduce_churn" | "optimize_pricing"
  reasoning: string;
  // Match coverage plan
  matchCoverage: {
    totalMatchesToday: number;
    selectedForContent: number;      // Only top N get content explosion
    topMatchIds: string[];
    selectionCriteria: string;
  };
  // Content priorities
  contentPlan: {
    primaryContentType: string;       // e.g., "post_match" | "hot_take" | "player_spotlight"
    platforms: string[];
    hooksToUse: string[];
    contentPiecesTarget: number;      // How many pieces to generate this cycle
  };
  // Growth allocation
  growthDirective: {
    focusChannel: string;             // Which platform to push hardest
    budgetRecommendation: string;     // "increase" | "maintain" | "reduce"
  };
  // Bottleneck
  bottleneck: {
    current: string;                  // "acquisition" | "retention" | "conversion" | "churn"
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestedFix: string;
  };
  // Confidence
  confidenceScore: number;           // 0-100, how confident is the agent in this decision?
}

@Injectable()
export class StrategyAgentService {
  private readonly logger = new Logger(StrategyAgentService.name);
  private cycleCount = 0;
  private decisionLog: StrategyDecision[] = [];

  constructor(
    private readonly hotScore: HotScoreService,
    private readonly signalRanker: SignalRankerService,
    private readonly retention: RetentionEngineService,
    private readonly flywheel: RevenueFlywheelService,
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Decide: what should the system do this cycle?
   */
  async decide(): Promise<StrategyDecision> {
    this.cycleCount++;
    const now = new Date();

    // Gather intelligence
    const dashboard = this.flywheel.getDashboard();
    const todayMatches = await this.matchesService.findTodayMatches();
    const retentionOverview = this.retention.getOverview();
    const churnRisks = this.retention.getChurnRiskUsers(5);

    // ── Determine primary objective ──
    let primaryObjective: string;
    let reasoning: string;

    if (dashboard.flywheel.bottleneck === 'acquisition' && dashboard.retention.dau < 50) {
      primaryObjective = 'grow_dau';
      reasoning = `DAU=${dashboard.retention.dau} < 50 且获客是瓶颈。优先增加内容分发量。`;
    } else if (dashboard.flywheel.bottleneck === 'retention' && (dashboard.retention.d7 || 0) < 20) {
      primaryObjective = 'increase_engagement';
      reasoning = `D7留存=${dashboard.retention.d7}% < 20%。优先养成使用习惯。`;
    } else if (dashboard.flywheel.bottleneck === 'conversion' && dashboard.revenue.paidConversionRate < 2) {
      primaryObjective = 'increase_conversion';
      reasoning = `付费转化率=${dashboard.revenue.paidConversionRate}% < 2%。优先强化决策价值定位。`;
    } else if (dashboard.flywheel.bottleneck === 'churn') {
      primaryObjective = 'reduce_churn';
      reasoning = `流失风险用户=${dashboard.retention.churnRiskCount}。优先挽回。`;
    } else {
      primaryObjective = 'optimize_pricing';
      reasoning = '核心指标健康。优化定价最大化 MRR。';
    }

    // ── Match selection ──
    const matchScores = todayMatches.map(m => ({
      matchId: m.id,
      score: this.quickScore(m),
    })).sort((a, b) => b.score - a.score);

    const topN = primaryObjective === 'grow_dau'
      ? Math.min(5, matchScores.length)   // Push more content for growth
      : Math.min(3, matchScores.length);  // Normal mode

    const topMatchIds = matchScores.slice(0, topN).map(m => m.matchId);

    // ── Content plan ──
    const hasHighScoring = matchScores[0]?.score >= 60;
    const contentPlan = {
      primaryContentType: hasHighScoring ? 'hot_take' : 'post_match',
      platforms: primaryObjective === 'grow_dau'
        ? ['xiaohongshu', 'twitter', 'douyin', 'wechat', 'seo']  // All platforms for growth
        : ['twitter', 'xiaohongshu', 'seo'],                      // Focused for efficiency
      hooksToUse: hasHighScoring ? ['numbers-first', 'thread-tease'] : ['data-drop', 'hot-take'],
      contentPiecesTarget: topN * (primaryObjective === 'grow_dau' ? 5 : 3), // N matches × platforms
    };

    // ── Growth directive ──
    const flywheel = dashboard.flywheel;
    const growthDirective = {
      focusChannel: flywheel.bottleneck === 'acquisition' ? 'twitter'
        : flywheel.bottleneck === 'conversion' ? 'wechat'
        : 'xiaohongshu',
      budgetRecommendation: flywheel.health === 'accelerating' ? 'increase'
        : flywheel.health === 'healthy' ? 'maintain'
        : 'increase',
    };

    // ── Bottleneck assessment ──
    const hasChurnRisks = churnRisks.length > 3;
    const bottleneck = {
      current: flywheel.bottleneck,
      severity: (flywheel.health === 'critical' ? 'critical'
        : flywheel.health === 'building' ? 'high'
        : hasChurnRisks ? 'medium'
        : 'low') as 'low' | 'medium' | 'high' | 'critical',
      suggestedFix: dashboard.flywheel.recommendation,
    };

    // ── Confidence ──
    const confidenceScore = this.calculateConfidence({
      matchCount: todayMatches.length,
      dau: dashboard.retention.dau,
      hasChurnData: churnRisks.length > 0,
      hasRevenueData: dashboard.revenue.payingUsers > 0,
      cycleCount: this.cycleCount,
    });

    const decision: StrategyDecision = {
      timestamp: now,
      cycle: this.cycleCount,
      primaryObjective,
      reasoning,
      matchCoverage: {
        totalMatchesToday: todayMatches.length,
        selectedForContent: topMatchIds.length,
        topMatchIds,
        selectionCriteria: `Top ${topN} by hot score (threshold: ${hasHighScoring ? '≥60' : 'any'})`,
      },
      contentPlan,
      growthDirective,
      bottleneck,
      confidenceScore,
    };

    this.decisionLog.push(decision);
    this.logger.log(
      `[StrategyAgent] Cycle #${this.cycleCount} | Objective: ${primaryObjective} | ` +
      `Covering ${topMatchIds.length}/${todayMatches.length} matches | ` +
      `Confidence: ${confidenceScore}% | Bottleneck: ${bottleneck.current} (${bottleneck.severity})`,
    );

    return decision;
  }

  /**
   * Quick match score without full HotScoreInput (for autonomous decision speed).
   */
  private quickScore(match: any): number {
    let score = 20;
    if (match.status === 'live') score += 30;
    if (match.status === 'finished') score += 15;
    const goals = (match.home_score || 0) + (match.away_score || 0);
    if (goals >= 5) score += 30;
    else if (goals >= 3) score += 20;
    else if (goals > 0) score += 10;
    if (match.group_name) score += 5;
    return score;
  }

  private calculateConfidence(ctx: {
    matchCount: number;
    dau: number;
    hasChurnData: boolean;
    hasRevenueData: boolean;
    cycleCount: number;
  }): number {
    let confidence = 50; // Base
    if (ctx.matchCount > 0) confidence += 15;
    if (ctx.dau > 10) confidence += 10;
    if (ctx.hasChurnData) confidence += 10;
    if (ctx.hasRevenueData) confidence += 10;
    if (ctx.cycleCount > 10) confidence += 5; // More cycles = more learning
    return Math.min(100, confidence);
  }

  getDecisionLog(limit = 10): StrategyDecision[] {
    return this.decisionLog.slice(-limit).reverse();
  }
}
