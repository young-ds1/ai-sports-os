import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StrategyAgentService, StrategyDecision } from './agents/strategy-agent.service';
import { ContentAgentService, ContentAgentReport } from './agents/content-agent.service';
import { DistributionAgentService, DistributionReport } from './agents/distribution-agent.service';
import { GrowthAgentService, GrowthAnalysis } from './agents/growth-agent.service';
import { MonetizationAgentService, MonetizationOptimization } from './agents/monetization-agent.service';

/**
 * AutonomousLoopService — the central orchestrator.
 *
 * Runs 5 autonomous agents in sequence every 30 minutes.
 *
 * Loop:
 *   Strategy → Content → Distribution → Growth → Monetization
 *     ↑_____________________________________________________|
 *              (feedback loop — Growth & Monetization
 *               inform next Strategy cycle)
 *
 * Human role: Monitor only. The system decides, executes, measures, and adapts.
 */

export interface LoopCycle {
  cycleId: number;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  status: 'running' | 'completed' | 'failed';
  strategy: StrategyDecision | null;
  content: ContentAgentReport | null;
  distribution: DistributionReport | null;
  growth: GrowthAnalysis | null;
  monetization: MonetizationOptimization | null;
  error?: string;
}

@Injectable()
export class AutonomousLoopService {
  private readonly logger = new Logger(AutonomousLoopService.name);
  private cycles: LoopCycle[] = [];
  private cycleCount = 0;
  private isRunning = false;
  private startedAt: Date | null = null;

  // Growth → Monetization feedback feeds into next Strategy cycle
  private lastGrowthAnalysis: GrowthAnalysis | null = null;
  private lastMonetizationOptimization: MonetizationOptimization | null = null;

  constructor(
    private readonly strategyAgent: StrategyAgentService,
    private readonly contentAgent: ContentAgentService,
    private readonly distributionAgent: DistributionAgentService,
    private readonly growthAgent: GrowthAgentService,
    private readonly monetizationAgent: MonetizationAgentService,
  ) {
    this.startedAt = new Date();
    this.logger.log('🤖 Autonomous Loop initialized. System will run itself every 30 minutes.');
  }

  /**
   * Main autonomous loop — runs every 30 minutes.
   */
  @Cron('*/30 * * * *')
  async executeCycle(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Previous cycle still running — skipping');
      return;
    }

    this.isRunning = true;
    this.cycleCount++;
    const startTime = Date.now();
    const cycle: LoopCycle = {
      cycleId: this.cycleCount,
      startedAt: new Date(),
      completedAt: null,
      durationMs: null,
      status: 'running',
      strategy: null,
      content: null,
      distribution: null,
      growth: null,
      monetization: null,
    };

    this.logger.log(`━━━ Cycle #${this.cycleCount} START ━━━`);

    try {
      // Phase 1: STRATEGY — Decide what to do
      this.logger.log(`[1/5] StrategyAgent: deciding...`);
      cycle.strategy = await this.strategyAgent.decide();
      this.logger.log(
        `[1/5] ✓ Strategy: ${cycle.strategy.primaryObjective} | ` +
        `covering ${cycle.strategy.matchCoverage.selectedForContent} matches | ` +
        `confidence ${cycle.strategy.confidenceScore}%`,
      );

      // Phase 2: CONTENT — Generate based on strategy
      this.logger.log(`[2/5] ContentAgent: generating...`);
      cycle.content = await this.contentAgent.execute(cycle.strategy);
      this.logger.log(
        `[2/5] ✓ Content: ${cycle.content.contentPiecesGenerated} pieces | ` +
        `${cycle.content.platformsUsed.length} platforms | ` +
        `${cycle.content.errors.length} errors`,
      );

      // Phase 3: DISTRIBUTION — Publish based on strategy
      this.logger.log(`[3/5] DistributionAgent: distributing...`);
      cycle.distribution = await this.distributionAgent.execute(cycle.strategy);
      this.logger.log(
        `[3/5] ✓ Distribution: ${cycle.distribution.totalPublished} published | ` +
        `${cycle.distribution.totalPending} pending`,
      );

      // Phase 4: GROWTH — Analyze performance
      this.logger.log(`[4/5] GrowthAgent: analyzing...`);
      cycle.growth = await this.growthAgent.analyze(cycle.strategy, cycle.content, cycle.distribution);
      this.lastGrowthAnalysis = cycle.growth;
      this.logger.log(
        `[4/5] ✓ Growth: CTR=${(cycle.growth.contentPerformance.avgCtr * 100).toFixed(1)}% | ` +
        `${cycle.growth.recommendations.length} recommendations`,
      );

      // Phase 5: MONETIZATION — Optimize revenue
      this.logger.log(`[5/5] MonetizationAgent: optimizing...`);
      cycle.monetization = await this.monetizationAgent.optimize(cycle.strategy, cycle.growth);
      this.lastMonetizationOptimization = cycle.monetization;
      this.logger.log(
        `[5/5] ✓ Monetization: Pro=$${cycle.monetization.pricing.proOptimalPrice} | ` +
        `MRR=$${cycle.monetization.revenueProjection.currentMrr}`,
      );

      cycle.status = 'completed';
    } catch (err: any) {
      cycle.status = 'failed';
      cycle.error = err.message;
      this.logger.error(`Cycle #${this.cycleCount} FAILED: ${err.message}`, err.stack);
    } finally {
      cycle.completedAt = new Date();
      cycle.durationMs = Date.now() - startTime;
      this.isRunning = false;
      this.cycles.push(cycle);

      // Keep last 100 cycles
      if (this.cycles.length > 100) {
        this.cycles = this.cycles.slice(-100);
      }

      this.logger.log(
        `━━━ Cycle #${this.cycleCount} ${cycle.status.toUpperCase()} ` +
        `(${cycle.durationMs}ms) ━━━\n` +
        `  Strategy: ${cycle.strategy?.primaryObjective || 'N/A'}\n` +
        `  Content:  ${cycle.content?.contentPiecesGenerated || 0} pieces\n` +
        `  Dist:     ${cycle.distribution?.totalPublished || 0} published\n` +
        `  Growth:   ${cycle.growth?.priorityAction || 'N/A'}\n` +
        `  Revenue:  $${cycle.monetization?.revenueProjection.currentMrr || 0} MRR`,
      );
    }
  }

  /**
   * Get current autonomous system status.
   */
  getStatus(): {
    isRunning: boolean;
    uptime: string;
    totalCycles: number;
    lastCycle: LoopCycle | null;
    currentObjective: string;
    feedbackState: {
      growth: GrowthAnalysis | null;
      monetization: MonetizationOptimization | null;
    };
  } {
    const uptimeMs = this.startedAt ? Date.now() - this.startedAt.getTime() : 0;
    const hours = Math.floor(uptimeMs / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);

    return {
      isRunning: this.isRunning,
      uptime: `${hours}h ${minutes}m`,
      totalCycles: this.cycleCount,
      lastCycle: this.cycles.length > 0 ? this.cycles[this.cycles.length - 1] : null,
      currentObjective: this.cycles.length > 0
        ? this.cycles[this.cycles.length - 1].strategy?.primaryObjective || 'idle'
        : 'initializing',
      feedbackState: {
        growth: this.lastGrowthAnalysis,
        monetization: this.lastMonetizationOptimization,
      },
    };
  }

  /**
   * Get cycle history.
   */
  getHistory(limit = 20): LoopCycle[] {
    return this.cycles.slice(-limit).reverse();
  }

  /**
   * Manual trigger — force a cycle immediately.
   */
  async triggerCycle(): Promise<LoopCycle> {
    await this.executeCycle();
    return this.cycles[this.cycles.length - 1];
  }
}
