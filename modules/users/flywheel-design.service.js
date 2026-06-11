"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlywheelDesignService = void 0;
const common_1 = require("@nestjs/common");
const SEGMENT_ROLES = [
    {
        segment: 'Sports Bettors',
        role: 'revenue',
        hypothesis: 'Bettors have the highest willingness to pay because AI predictions directly support betting decisions.',
        assumedFlow: 'Bettor sees prediction → uses AI to validate → pays for deeper insights → repeats for next match',
        status: 'HYPOTHESIS_ONLY',
        validationGate: 'At least 1 payment event from this segment + repeat AI usage > 3 sessions',
    },
    {
        segment: 'Fantasy Players',
        role: 'retention',
        hypothesis: 'Fantasy players return daily to check player stats and form. They are the D7/D30 retention engine.',
        assumedFlow: 'Fantasy player checks daily AI analysis → tracks player performance → returns next matchday → stays for season',
        status: 'HYPOTHESIS_ONLY',
        validationGate: 'D7 > 50% for this segment + avg sessions/user > 5',
    },
    {
        segment: 'Content Creators',
        role: 'growth',
        hypothesis: 'Content creators share AI insights to their audience, generating organic top-of-funnel traffic.',
        assumedFlow: 'Creator finds hot take → shares to X/小红书 → followers click UTM link → new user signs up → becomes Bettor or Fantasy',
        status: 'HYPOTHESIS_ONLY',
        validationGate: 'At least 5 share events with measurable UTM attribution + 10+ invited users',
    },
    {
        segment: 'Football Fans',
        role: 'none',
        hypothesis: 'Football fans are the largest segment but lowest ARPU. They are a reservoir, not a flywheel driver.',
        assumedFlow: 'Fan views match data → occasional AI use → low conversion → retention depends on match schedule',
        status: 'HYPOTHESIS_ONLY',
        validationGate: 'No specific gate. Monitored as baseline.',
    },
    {
        segment: 'AI Enthusiasts',
        role: 'retention',
        hypothesis: 'AI enthusiasts explore all features deeply. They provide the richest behavioral data for product improvement.',
        assumedFlow: 'Enthusiast tries every AI feature → gives feedback through usage patterns → high session depth → potential power user',
        status: 'HYPOTHESIS_ONLY',
        validationGate: 'Avg AI requests/user > 10 + session depth > 5 pages',
    },
    {
        segment: 'Casual Sports Users',
        role: 'none',
        hypothesis: 'Casual users visit during big events only. Not a flywheel driver.',
        assumedFlow: 'Casual user visits during World Cup → low engagement → churns after tournament',
        status: 'HYPOTHESIS_ONLY',
        validationGate: 'No specific gate. Expected to churn post-tournament.',
    },
];
const FLOW_MAP = [
    {
        from: 'Content Creators', to: 'Casual Sports Users',
        flow: 'Creator shares hot take → Casual user clicks → lands on match page',
        strength: 'strong',
        hypothesis: 'Creators are the top-of-funnel engine. Their output attracts the widest audience.',
        status: 'HYPOTHESIS_ONLY',
    },
    {
        from: 'Casual Sports Users', to: 'Football Fans',
        flow: 'Casual user returns 3+ times during tournament → becomes Football Fan',
        strength: 'moderate',
        hypothesis: 'A fraction of casual users convert to regular fans during major tournaments.',
        status: 'HYPOTHESIS_ONLY',
    },
    {
        from: 'Football Fans', to: 'Fantasy Players',
        flow: 'Fan discovers player stats → starts tracking fantasy-relevant data → becomes Fantasy Player',
        strength: 'moderate',
        hypothesis: 'Fantasy sports is the bridge from passive viewing to active data consumption.',
        status: 'HYPOTHESIS_ONLY',
    },
    {
        from: 'Fantasy Players', to: 'Sports Bettors',
        flow: 'Fantasy player seeks deeper predictions → uses AI for betting insights → becomes Bettor',
        strength: 'strong',
        hypothesis: 'Fantasy and betting are adjacent behaviors. Fantasy trains the data habit; betting monetizes it.',
        status: 'HYPOTHESIS_ONLY',
    },
    {
        from: 'AI Enthusiasts', to: 'Content Creators',
        flow: 'AI enthusiast discovers compelling insights → shares them publicly → becomes Creator',
        strength: 'weak',
        hypothesis: 'A small fraction of power users evolve into content creators.',
        status: 'HYPOTHESIS_ONLY',
    },
    {
        from: 'Sports Bettors', to: 'Content Creators',
        flow: 'Bettor wins using AI prediction → shares success publicly → becomes Creator reference',
        strength: 'weak',
        hypothesis: '"AI was right" stories are the strongest social proof for the product.',
        status: 'HYPOTHESIS_ONLY',
    },
];
const FLYWHEEL_EVENTS = [
    {
        eventName: 'user_created',
        description: 'New user signs up or is tracked on first visit',
        triggersWhen: 'First page view or Supabase auth callback',
        carriesData: ['utm_source', 'utm_campaign', 'referrer_user_id', 'segment_guess'],
        feedsInto: ['user_inflow_by_segment', 'conversion_by_segment'],
    },
    {
        eventName: 'content_shared',
        description: 'User shares AI-generated content to external platform',
        triggersWhen: 'Share button clicked on analysis page or chat',
        carriesData: ['sharer_segment', 'content_type', 'platform', 'match_id'],
        feedsInto: ['growth_loop', 'conversion_by_segment'],
    },
    {
        eventName: 'prediction_viewed',
        description: 'User views an AI prediction for a match',
        triggersWhen: 'Prediction card rendered on match page or analysis page',
        carriesData: ['user_segment', 'match_id', 'prediction_type'],
        feedsInto: ['revenue_by_segment', 'ai_usage'],
    },
    {
        eventName: 'ai_analysis_used',
        description: 'User views full AI analysis report',
        triggersWhen: 'Analysis page loaded (from cache or generated)',
        carriesData: ['user_segment', 'match_id', 'source', 'latency_ms'],
        feedsInto: ['retention_by_segment', 'ai_usage'],
    },
    {
        eventName: 'payment_started',
        description: 'User initiates payment flow',
        triggersWhen: 'Stripe checkout session created or upgrade button clicked',
        carriesData: ['user_segment', 'tier', 'amount', 'source_feature'],
        feedsInto: ['revenue_by_segment'],
    },
    {
        eventName: 'segment_transition',
        description: 'User behavior indicates segment change',
        triggersWhen: 'AI usage or payment patterns cross segment thresholds',
        carriesData: ['user_id', 'from_segment', 'to_segment', 'trigger_reason'],
        feedsInto: ['flywheel_velocity'],
    },
];
const DASHBOARD_SCHEMA = {
    _note: 'ALL VALUES ARE PLACEHOLDERS. COMPUTED ONLY WHEN VALIDATION GATES ARE MET.',
    user_inflow_by_segment: {
        schema: { Sports_Bettors: 'number', Fantasy_Players: 'number', AI_Enthusiasts: 'number', Content_Creators: 'number', Football_Fans: 'number', Casual_Users: 'number' },
        description: 'New users per day, broken down by assigned segment',
    },
    conversion_by_segment: {
        schema: { Casual_to_Fan: { from: 'Casual Users', to: 'Football Fans', rate: 'percentage' }, Fan_to_Fantasy: { from: 'Football Fans', to: 'Fantasy Players', rate: 'percentage' }, Fantasy_to_Bettor: { from: 'Fantasy Players', to: 'Sports Bettors', rate: 'percentage' } },
        description: 'Conversion rates between segments',
    },
    revenue_by_segment: {
        schema: { Sports_Bettors: { total: 'USD', per_user: 'USD', mrr: 'USD' }, Fantasy_Players: { total: 'USD', per_user: 'USD', mrr: 'USD' } },
        description: 'Revenue contribution by segment',
    },
    retention_by_segment: {
        schema: { Sports_Bettors: { d7: 'percentage', d30: 'percentage', avg_sessions: 'number' }, Fantasy_Players: { d7: 'percentage', d30: 'percentage', avg_sessions: 'number' } },
        description: 'Retention metrics by segment',
    },
    flywheel_velocity: {
        schema: { value: 'number', description: 'Net flow: new users entering vs churning per week' },
    },
};
const VALIDATION_GATES = [
    { gate: 'G1_MIN_USERS', condition: '100+ real tracked users exist', currentStatus: 'NOT_MET', requiredFor: 'All flywheel measurements' },
    { gate: 'G2_DAU', condition: '30+ daily active users (7-day avg)', currentStatus: 'NOT_MET', requiredFor: 'Retention and conversion metrics' },
    { gate: 'G3_REPEAT_AI', condition: 'At least 10 users with 3+ AI sessions each', currentStatus: 'NOT_MET', requiredFor: 'Habit formation validation' },
    { gate: 'G4_FIRST_PAY', condition: 'At least 1 payment event recorded', currentStatus: 'NOT_MET', requiredFor: 'Revenue flywheel validation' },
    { gate: 'G5_SEGMENT_FLOW', condition: 'At least 5 users transitioned between segments', currentStatus: 'NOT_MET', requiredFor: 'Flow map validation' },
    { gate: 'G6_CONTENT_ATTRIBUTION', condition: 'At least 10 users with verified UTM attribution', currentStatus: 'NOT_MET', requiredFor: 'Growth loop validation' },
];
let FlywheelDesignService = class FlywheelDesignService {
    getHypothesisDocument() {
        const gatesMet = VALIDATION_GATES.filter(g => g.currentStatus === 'MET').length;
        const flywheelIsLive = gatesMet >= 4; // Need 4/6 gates for flywheel to be "live"
        return {
            version: '1.0',
            designedAt: new Date().toISOString(),
            status: 'DESIGN_ONLY',
            disclaimer: 'THIS IS A HYPOTHESIS DOCUMENT. No values are computed from real data. All segment roles, flow maps, and schemas are assumptions awaiting validation. The flywheel is considered "live" only when 4/6 validation gates are met.',
            segmentRoles: SEGMENT_ROLES,
            flowMap: FLOW_MAP,
            events: FLYWHEEL_EVENTS,
            dashboardSchema: DASHBOARD_SCHEMA,
            validationGates: VALIDATION_GATES,
            gatesMet,
            gatesTotal: VALIDATION_GATES.length,
            flywheelIsLive,
            nextAction: flywheelIsLive
                ? 'All validation gates met. Flywheel is LIVE. Switch from hypothesis mode to measurement mode.'
                : `${gatesMet}/${VALIDATION_GATES.length} gates met. Continue acquiring users. Primary gap: ${this.primaryGap()}.`,
        };
    }
    primaryGap() {
        const notMet = VALIDATION_GATES.filter(g => g.currentStatus === 'NOT_MET');
        if (notMet.length === 0)
            return 'None';
        return notMet[0].gate;
    }
};
exports.FlywheelDesignService = FlywheelDesignService;
exports.FlywheelDesignService = FlywheelDesignService = __decorate([
    (0, common_1.Injectable)()
], FlywheelDesignService);
//# sourceMappingURL=flywheel-design.service.js.map