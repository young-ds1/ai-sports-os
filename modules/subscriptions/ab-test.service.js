"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ABTestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABTestService = void 0;
const common_1 = require("@nestjs/common");
let ABTestService = ABTestService_1 = class ABTestService {
    logger = new common_1.Logger(ABTestService_1.name);
    // Active experiment
    activeExperiment = {
        id: 'exp_001_pro_teaser_june2026',
        name: 'Pro Teaser Effectiveness',
        description: 'Measure if showing Pro preview teasers increases conversion from Free to VIP/Pro',
        startDate: new Date('2026-06-12'),
        groups: {
            A: {
                weight: 50, // 50% of users — control
                showTeasers: false,
                teaserTiming: 'never',
                freeLimitMultiplier: 1.0,
            },
            B: {
                weight: 35, // 35% of users — after-question teaser
                showTeasers: true,
                teaserTiming: 'after',
                freeLimitMultiplier: 1.0,
            },
            C: {
                weight: 15, // 15% of users — aggressive before-question
                showTeasers: true,
                teaserTiming: 'before',
                freeLimitMultiplier: 0.7, // Slightly lower free limit to test urgency
            },
        },
    };
    // Conversion tracking per group
    conversionData = {
        A: { users: new Set(), conversions: new Set(), totalQuestions: 0, totalSessions: 0 },
        B: { users: new Set(), conversions: new Set(), totalQuestions: 0, totalSessions: 0 },
        C: { users: new Set(), conversions: new Set(), totalQuestions: 0, totalSessions: 0 },
    };
    /**
     * Assign a user to an experiment group.
     * Deterministic — same user always gets same group.
     */
    assignGroup(userId) {
        // Simple hash-based assignment
        const hash = this.hashString(userId);
        const percentile = hash % 100;
        let cumulative = 0;
        for (const [group, config] of Object.entries(this.activeExperiment.groups)) {
            cumulative += config.weight;
            if (percentile < cumulative) {
                this.conversionData[group].users.add(userId);
                return group;
            }
        }
        return 'A'; // Fallback to control
    }
    /**
     * Check if teasers should be shown to this user.
     */
    shouldShowTeasers(userId) {
        const group = this.assignGroup(userId);
        const config = this.activeExperiment.groups[group];
        return { show: config.showTeasers, timing: config.teaserTiming };
    }
    /**
     * Get the effective free limit multiplier for this user.
     */
    getFreeLimitMultiplier(userId) {
        const group = this.assignGroup(userId);
        return this.activeExperiment.groups[group].freeLimitMultiplier;
    }
    /**
     * Track a user action for the experiment.
     */
    trackAction(userId, action) {
        const group = this.assignGroup(userId);
        if (action === 'question')
            this.conversionData[group].totalQuestions++;
        if (action === 'session')
            this.conversionData[group].totalSessions++;
    }
    /**
     * Track a conversion (user upgrades from Free).
     */
    trackConversion(userId) {
        const group = this.assignGroup(userId);
        this.conversionData[group].conversions.add(userId);
        this.logger.log(`[ABTest] Conversion: user=${userId.substring(0, 8)} group=${group}`);
    }
    /**
     * Get experiment results.
     */
    getResults() {
        const results = [];
        for (const [group, data] of Object.entries(this.conversionData)) {
            const totalUsers = data.users.size;
            const conversions = data.conversions.size;
            results.push({
                experimentId: this.activeExperiment.id,
                group: group,
                totalUsers,
                conversions,
                conversionRate: totalUsers > 0 ? conversions / totalUsers : 0,
                avgQuestionsPerUser: totalUsers > 0 ? data.totalQuestions / totalUsers : 0,
                avgSessionsPerUser: totalUsers > 0 ? data.totalSessions / totalUsers : 0,
            });
        }
        return { experiment: this.activeExperiment, results };
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
};
exports.ABTestService = ABTestService;
exports.ABTestService = ABTestService = ABTestService_1 = __decorate([
    (0, common_1.Injectable)()
], ABTestService);
//# sourceMappingURL=ab-test.service.js.map