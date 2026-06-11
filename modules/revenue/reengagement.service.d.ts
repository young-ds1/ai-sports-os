import { RetentionEngineService } from './retention-engine.service';
import { StreakTrackerService } from './streak-tracker.service';
import { MatchesService } from '../domain/matches/matches.service';
/**
 * ReengagementService — brings dormant users back with event-driven triggers.
 *
 * Triggers:
 * - "Your team is playing tonight" → match-specific nudge
 * - "You have a 5-day streak — don't lose it!" → loss aversion
 * - "3 new AI analyses since you last visited" → FOMO
 * - "关键比赛今晚开打" → event-driven
 *
 * Output: structured notification payloads (can be sent via email/push/WeChat).
 */
export interface ReengagementNudge {
    userId: string;
    type: 'streak_risk' | 'team_match' | 'new_content' | 'key_match';
    title: string;
    body: string;
    cta: {
        text: string;
        url: string;
    };
    priority: 'high' | 'medium' | 'low';
}
export declare class ReengagementService {
    private readonly retention;
    private readonly streakTracker;
    private readonly matchesService;
    private readonly logger;
    constructor(retention: RetentionEngineService, streakTracker: StreakTrackerService, matchesService: MatchesService);
    /**
     * Generate re-engagement nudges for at-risk users.
     */
    generateNudges(): Promise<ReengagementNudge[]>;
    /**
     * Generate one personalized nudge for a specific user.
     */
    getPersonalNudge(userId: string, tier: string): Promise<ReengagementNudge | null>;
    private dailyReengagementSweep;
}
//# sourceMappingURL=reengagement.service.d.ts.map