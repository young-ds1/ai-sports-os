import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SignalRankerService } from './signal-ranker.service';
import { HotScoreInput } from './hot-score.service';

/**
 * SignalService v2 — listens for match events, converts them to HotScoreInput,
 * and submits to SignalRanker for scoring.
 *
 * Key change from STEP 7: This service no longer triggers content directly.
 * Instead, it submits to the Ranker. Only top 10% signals explode.
 */

interface MatchPayload {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  competition: string;
  tournamentStage?: string;
  elapsedMinute?: number;
  metadata?: {
    playerName?: string;
    milestone?: string;
    totalGoals?: number;
    hasComeback?: boolean;
    hasRedCard?: boolean;
    lateDramaMinutes?: number;
  };
  events?: Array<{ type: string; minute: number; comment?: string }>;
}

// Star player database — in production, this comes from players table + ranking API
const STAR_PLAYERS: Record<string, Array<{ name: string; tier: 'goat' | 'superstar' | 'star' | 'notable' }>> = {
  Argentina: [
    { name: 'Lionel Messi', tier: 'goat' },
    { name: 'Julián Álvarez', tier: 'star' },
  ],
  Brazil: [
    { name: 'Vinicius Jr', tier: 'superstar' },
    { name: 'Rodrygo', tier: 'star' },
  ],
  France: [
    { name: 'Kylian Mbappé', tier: 'superstar' },
  ],
  England: [
    { name: 'Jude Bellingham', tier: 'superstar' },
    { name: 'Harry Kane', tier: 'star' },
  ],
  Germany: [
    { name: 'Jamal Musiala', tier: 'star' },
    { name: 'Florian Wirtz', tier: 'star' },
  ],
  Spain: [
    { name: 'Lamine Yamal', tier: 'star' },
    { name: 'Pedri', tier: 'star' },
  ],
  Portugal: [
    { name: 'Cristiano Ronaldo', tier: 'goat' },
  ],
  Netherlands: [
    { name: 'Virgil van Dijk', tier: 'star' },
  ],
};

@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);

  constructor(private readonly signalRanker: SignalRankerService) {}

  @OnEvent('match.finished', { async: true })
  async onMatchFinished(payload: MatchPayload): Promise<void> {
    this.logger.log(`[Signal] match.finished → ${payload.homeTeam} ${payload.homeScore}-${payload.awayScore} ${payload.awayTeam}`);

    const input = this.buildHotScoreInput(payload);
    // Urgent: finished matches get immediate ranking
    this.signalRanker.submitUrgent(input);
  }

  @OnEvent('match.live_update', { async: true })
  async onMatchLiveUpdate(payload: MatchPayload): Promise<void> {
    // Only submit live updates if there's drama
    const goals = (payload.homeScore || 0) + (payload.awayScore || 0);
    if (goals >= 3 || payload.metadata?.hasComeback || payload.metadata?.hasRedCard) {
      const input = this.buildHotScoreInput(payload);
      this.signalRanker.submit(input);
    }
  }

  @OnEvent('match.scheduled', { async: true })
  async onMatchScheduled(payload: MatchPayload): Promise<void> {
    const input = this.buildHotScoreInput(payload);
    // Scheduled matches go to buffer, ranked in batch
    this.signalRanker.submit(input);
  }

  /**
   * Build a HotScoreInput from a match event payload.
   */
  private buildHotScoreInput(payload: MatchPayload): HotScoreInput {
    const homeStars = STAR_PLAYERS[payload.homeTeam] || [];
    const awayStars = STAR_PLAYERS[payload.awayTeam] || [];
    const allStars = [...homeStars, ...awayStars];

    const homeScore = payload.homeScore || 0;
    const awayScore = payload.awayScore || 0;
    const totalGoals = payload.metadata?.totalGoals ?? (homeScore + awayScore);

    // Social buzz simulation (Phase 4: real API)
    const hasStars = allStars.filter(s => s.tier === 'goat' || s.tier === 'superstar').length;
    const simulatedBuzz = hasStars > 1 ? 50000 : hasStars > 0 ? 20000 : 5000;

    // Trend position simulation
    const simulatedTrend = hasStars > 1 ? 2 : hasStars > 0 ? 5 : 25;

    return {
      matchId: payload.matchId,
      homeTeam: payload.homeTeam,
      awayTeam: payload.awayTeam,
      competition: payload.competition,
      tournamentStage: payload.tournamentStage || 'group',
      homeScore,
      awayScore,
      status: payload.status,
      elapsedMinute: payload.elapsedMinute,
      starPlayers: allStars,
      totalGoals,
      goalDiff: Math.abs(homeScore - awayScore),
      hasRedCard: payload.metadata?.hasRedCard || false,
      hasComeback: payload.metadata?.hasComeback || false,
      isExtraTime: false,
      isPenaltyShootout: false,
      lateDramaMinutes: payload.metadata?.lateDramaMinutes,
      externalMentions: simulatedBuzz,
      trendPosition: simulatedTrend,
    };
  }
}
