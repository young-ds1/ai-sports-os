import { PricingTestService } from './pricing-test.service';
/**
 * DecisionValueService — positions AI Sports OS as a "decision engine",
 * not a "data tool". Every upgrade prompt answers: "What better decision
 * can you make with Pro that you can't make with Free?"
 *
 * Three decision layers:
 *   Free  → Know WHAT happened
 *   Pro   → Understand WHY + predict WHAT WILL happen
 *   Elite → Simulate WHAT IF + optimize decisions
 */
export interface UpgradePage {
    hero: {
        headline: string;
        subheadline: string;
        decisionQuestion: string;
    };
    comparison: Array<{
        feature: string;
        free: string;
        pro: string;
        elite: string;
        isDecisionFeature: boolean;
    }>;
    socialProof: {
        format: string;
        text: string;
    };
    faq: Array<{
        q: string;
        a: string;
    }>;
    urgency: {
        type: 'worldcup_countdown' | 'limited_offer' | 'none';
        message: string;
    };
}
export declare class DecisionValueService {
    private readonly pricingTest;
    constructor(pricingTest: PricingTestService);
    /**
     * Build the upgrade page — decision-system positioning.
     */
    buildUpgradePage(userId: string): UpgradePage;
    /**
     * Generate a contextual upgrade CTA based on what the user just asked.
     */
    getContextualCTA(trigger: string, pricing: {
        monthly: number;
    }): {
        headline: string;
        body: string;
        buttonText: string;
        urgency: 'low' | 'medium' | 'high';
    };
}
//# sourceMappingURL=decision-value.service.d.ts.map