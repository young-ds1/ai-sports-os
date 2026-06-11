import { Injectable, Logger } from '@nestjs/common';
import { ContentExplosionService } from '../../content/factory/content-explosion.service';
import { HookOptimizerService } from '../../content/factory/hook-optimizer.service';
import { SignalRankerService, ExplosiveSignal } from '../../content/signals/signal-ranker.service';
import { HotScoreService, HotScoreInput } from '../../content/signals/hot-score.service';
import { StrategyDecision } from './strategy-agent.service';
import { MatchesService } from '../../domain/matches/matches.service';

/**
 * ContentAgent — autonomous content generation.
 *
 * Takes the StrategyDecision → generates content for selected matches.
 * Uses HookOptimizer to automatically select best hooks.
 * No human chooses what to write.
 */

export interface ContentAgentReport {
  timestamp: Date;
  matchesProcessed: number;
  contentPiecesGenerated: number;
  platformsUsed: string[];
  primaryContentType: string;
  hooksApplied: string[];
  errors: string[];
  summary: string;
}

@Injectable()
export class ContentAgentService {
  private readonly logger = new Logger(ContentAgentService.name);

  constructor(
    private readonly contentExplosion: ContentExplosionService,
    private readonly hookOptimizer: HookOptimizerService,
    private readonly signalRanker: SignalRankerService,
    private readonly hotScore: HotScoreService,
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Execute content generation based on strategy.
   */
  async execute(strategy: StrategyDecision): Promise<ContentAgentReport> {
    const errors: string[] = [];
    let generatedCount = 0;

    this.logger.log(
      `[ContentAgent] Executing: ${strategy.matchCoverage.selectedForContent} matches → ` +
      `${strategy.contentPlan.contentPiecesTarget} pieces target`,
    );

    // For each selected match, explode to platforms
    for (const matchId of strategy.matchCoverage.topMatchIds) {
      try {
        const match = await this.matchesService.findById(matchId);
        if (!match) {
          errors.push(`Match ${matchId} not found`);
          continue;
        }

        // Build hot score input for the explosion
        const signal: HotScoreInput = {
          matchId: match.id,
          homeTeam: match.home_team?.name || 'Unknown',
          awayTeam: match.away_team?.name || 'Unknown',
          competition: match.competition?.name || 'World Cup',
          tournamentStage: match.round?.includes('Group') ? 'group' : 'knockout',
          homeScore: match.home_score || undefined,
          awayScore: match.away_score || undefined,
          status: match.status,
          starPlayers: [], // Simplified — real impl pulls from DB
          totalGoals: (match.home_score || 0) + (match.away_score || 0),
        };

        const score = this.hotScore.calculate(signal);
        const explosiveSignal: ExplosiveSignal = {
          ...score,
          matchData: signal,
          triggeredAt: new Date(),
        };

        // Submit to ranker → triggers ContentExplosionService.onExplosiveSignal
        this.signalRanker.submitUrgent(signal);

        generatedCount++;
        this.logger.log(
          `[ContentAgent] 💥 Explosion: ${signal.homeTeam} vs ${signal.awayTeam} ` +
          `(score=${score.totalScore} tier=${score.tier})`,
        );
      } catch (err: any) {
        errors.push(`Match ${matchId}: ${err.message}`);
        this.logger.error(`[ContentAgent] Error processing ${matchId}`, err);
      }
    }

    const report: ContentAgentReport = {
      timestamp: new Date(),
      matchesProcessed: strategy.matchCoverage.selectedForContent,
      contentPiecesGenerated: generatedCount * strategy.contentPlan.platforms.length,
      platformsUsed: strategy.contentPlan.platforms,
      primaryContentType: strategy.contentPlan.primaryContentType,
      hooksApplied: strategy.contentPlan.hooksToUse,
      errors,
      summary: errors.length === 0
        ? `成功为 ${generatedCount} 场比赛生成 ${generatedCount * strategy.contentPlan.platforms.length} 条内容`
        : `生成了 ${generatedCount} 条内容，${errors.length} 个错误`,
    };

    return report;
  }
}
