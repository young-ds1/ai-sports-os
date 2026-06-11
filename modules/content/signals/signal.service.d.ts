import { SignalRankerService } from './signal-ranker.service';
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
    events?: Array<{
        type: string;
        minute: number;
        comment?: string;
    }>;
}
export declare class SignalService {
    private readonly signalRanker;
    private readonly logger;
    constructor(signalRanker: SignalRankerService);
    onMatchFinished(payload: MatchPayload): Promise<void>;
    onMatchLiveUpdate(payload: MatchPayload): Promise<void>;
    onMatchScheduled(payload: MatchPayload): Promise<void>;
    /**
     * Build a HotScoreInput from a match event payload.
     */
    private buildHotScoreInput;
}
export {};
//# sourceMappingURL=signal.service.d.ts.map