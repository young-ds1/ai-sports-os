import { MatchesService } from '../domain/matches/matches.service';
import { OpenaiService } from '../ai-engine/engines/openai.service';
import { CostTrackerService } from '../ai-engine/cost/cost-tracker.service';
import { StreakTrackerService } from './streak-tracker.service';
/**
 * HabitLoopService — creates daily AI touchpoints so users build a habit.
 *
 * Three daily touchpoints:
 * 1. "Today's Picks" — AI-selected must-watch matches
 * 2. "Team Pulse" — one-sentence status update on followed teams
 * 3. "Daily Insight" — one surprising stat or trend
 *
 * Goal: User opens the app even when there's no live match.
 */
export interface DailyDigest {
    date: string;
    todaysPicks: Array<{
        matchId: string;
        headline: string;
        reason: string;
        kickoffTime: string;
    }>;
    teamPulse: Array<{
        teamName: string;
        status: string;
        nextMatch: string;
    }>;
    dailyInsight: string;
    userStreak?: {
        current: number;
        badge: string | null;
        message: string;
    };
}
export declare class HabitLoopService {
    private readonly matchesService;
    private readonly openai;
    private readonly costTracker;
    private readonly streakTracker;
    private readonly logger;
    private todayDigest;
    constructor(matchesService: MatchesService, openai: OpenaiService, costTracker: CostTrackerService, streakTracker: StreakTrackerService);
    /**
     * Generate today's digest. Cached for the day.
     */
    getTodayDigest(userId?: string): Promise<DailyDigest>;
    private buildStreakMessage;
}
//# sourceMappingURL=habit-loop.service.d.ts.map