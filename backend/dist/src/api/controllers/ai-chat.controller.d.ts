import { ChatAgentService } from '../../../../modules/ai-engine/chat/chat-agent.service';
import { ChatService } from '../../../../modules/ai-engine/chat/chat.service';
import { CostTrackerService } from '../../../../modules/ai-engine/cost/cost-tracker.service';
import { PaywallTriggerService } from '../../../../modules/subscriptions/paywall-trigger.service';
import { TieredResponseService } from '../../../../modules/subscriptions/tiered-response.service';
import { ABTestService } from '../../../../modules/subscriptions/ab-test.service';
import { PreviewTeaserService } from '../../../../modules/subscriptions/preview-teaser.service';
import { SubscriptionsService } from '../../../../modules/subscriptions/subscriptions.service';
export declare class AiChatController {
    private readonly chatAgent;
    private readonly chatService;
    private readonly costTracker;
    private readonly paywallTrigger;
    private readonly tieredResponse;
    private readonly abTest;
    private readonly previewTeaser;
    private readonly subscriptionsService;
    constructor(chatAgent: ChatAgentService, chatService: ChatService, costTracker: CostTrackerService, paywallTrigger: PaywallTriggerService, tieredResponse: TieredResponseService, abTest: ABTestService, previewTeaser: PreviewTeaserService, subscriptionsService: SubscriptionsService);
    sendMessage(body: {
        sessionId?: string;
        message: string;
        matchId?: string;
        teamId?: string;
        playerId?: string;
        matchStage?: string;
        matchName?: string;
    }, req: any): Promise<{
        message: {
            role: string;
            message: string;
            sources: never[];
            confidence: number;
            id?: undefined;
        };
        meta: {
            error: string;
            upgrade_url: string;
            remaining?: undefined;
            limit?: undefined;
            estimated_cost?: undefined;
        };
        sessionId?: undefined;
        monetization?: undefined;
    } | {
        sessionId: string;
        message: {
            id: string;
            role: string;
            message: string;
            sources: import("@modules/ai-engine/engines/source-tracer.service").Source[];
            confidence: number;
        };
        monetization: {
            tier: import("@modules/users/subscriptions/tier-config").SubscriptionTier;
            ab_group: import("../../../../modules/subscriptions/ab-test.service").TestGroup;
            paywall_triggered: boolean;
            trigger_category: "prediction" | "tactics" | "high_usage" | "key_match" | null;
            features_unlocked: string[];
            features_locked: string[];
            upgrade_cta: string | undefined;
        };
        meta: {
            remaining: number;
            limit: any;
            estimated_cost: number;
            error?: undefined;
            upgrade_url?: undefined;
        };
    }>;
    getHistory(body: {
        sessionId: string;
    }): Promise<{
        data: import("@modules/ai-engine/chat/chat-message.entity").ChatMessage[];
    }>;
}
//# sourceMappingURL=ai-chat.controller.d.ts.map