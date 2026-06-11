/**
 * Flywheel Hypothesis Design — NOT a measurement system.
 *
 * This defines WHAT we will measure once real user flows exist.
 * All values are hypothesis-only until validation gates are met.
 *
 * Gates: 100+ users, 30+ DAU, repeat AI usage, 1+ payment.
 */
export interface SegmentRole {
    segment: string;
    role: 'revenue' | 'retention' | 'growth' | 'none';
    hypothesis: string;
    assumedFlow: string;
    status: 'HYPOTHESIS_ONLY';
    validationGate: string;
}
export interface FlowEdge {
    from: string;
    to: string;
    flow: string;
    strength: 'strong' | 'moderate' | 'weak' | 'unknown';
    hypothesis: string;
    status: 'HYPOTHESIS_ONLY';
}
export interface FlywheelEvent {
    eventName: string;
    description: string;
    triggersWhen: string;
    carriesData: string[];
    feedsInto: string[];
}
export interface FlywheelDashboardSchema {
    _note: 'ALL VALUES ARE PLACEHOLDERS. COMPUTED ONLY WHEN VALIDATION GATES ARE MET.';
    user_inflow_by_segment: {
        schema: Record<string, 'number'>;
        description: 'New users per day, broken down by assigned segment';
    };
    conversion_by_segment: {
        schema: Record<string, {
            from: string;
            to: string;
            rate: string;
        }>;
        description: 'Conversion rates between segments (e.g., Fan → Fantasy)';
    };
    revenue_by_segment: {
        schema: Record<string, {
            total: string;
            per_user: string;
            mrr: string;
        }>;
        description: 'Revenue contribution by segment';
    };
    retention_by_segment: {
        schema: Record<string, {
            d7: string;
            d30: string;
            avg_sessions: string;
        }>;
        description: 'Retention metrics broken down by segment';
    };
    flywheel_velocity: {
        schema: {
            value: 'number';
            description: 'Net flow: new users entering vs churning per week';
        };
    };
}
export interface ValidationGate {
    gate: string;
    condition: string;
    currentStatus: 'NOT_MET' | 'IN_PROGRESS' | 'MET';
    requiredFor: string;
}
export interface FlywheelHypothesisDocument {
    version: string;
    designedAt: string;
    status: 'DESIGN_ONLY';
    disclaimer: string;
    segmentRoles: SegmentRole[];
    flowMap: FlowEdge[];
    events: FlywheelEvent[];
    dashboardSchema: FlywheelDashboardSchema;
    validationGates: ValidationGate[];
    gatesMet: number;
    gatesTotal: number;
    flywheelIsLive: boolean;
    nextAction: string;
}
export declare class FlywheelDesignService {
    getHypothesisDocument(): FlywheelHypothesisDocument;
    private primaryGap;
}
//# sourceMappingURL=flywheel-design.service.d.ts.map