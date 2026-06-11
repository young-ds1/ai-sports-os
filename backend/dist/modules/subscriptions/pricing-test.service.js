"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PricingTestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingTestService = void 0;
const common_1 = require("@nestjs/common");
const PRO_BUCKETS = [
    { tier: 'pro', priceId: 'pro_5', monthlyPrice: 5, annualPrice: 48, displayName: 'Pro', weight: 40 },
    { tier: 'pro', priceId: 'pro_9', monthlyPrice: 9, annualPrice: 86, displayName: 'Pro', weight: 40 },
    { tier: 'pro', priceId: 'pro_12', monthlyPrice: 12, annualPrice: 115, displayName: 'Pro', weight: 20 },
];
const ELITE_BUCKETS = [
    { tier: 'elite', priceId: 'elite_19', monthlyPrice: 19, annualPrice: 182, displayName: 'Elite', weight: 50 },
    { tier: 'elite', priceId: 'elite_29', monthlyPrice: 29, annualPrice: 278, displayName: 'Elite', weight: 50 },
];
let PricingTestService = PricingTestService_1 = class PricingTestService {
    logger = new common_1.Logger(PricingTestService_1.name);
    // Impression & conversion tracking per bucket
    impressions = {}; // priceId → userIds
    conversions = {};
    constructor() {
        for (const b of [...PRO_BUCKETS, ...ELITE_BUCKETS]) {
            this.impressions[b.priceId] = new Set();
            this.conversions[b.priceId] = new Set();
        }
    }
    /**
     * Assign a user to a price bucket. Deterministic — same user always sees same price.
     */
    assignPrice(userId, tier) {
        const buckets = tier === 'pro' ? PRO_BUCKETS : ELITE_BUCKETS;
        const hash = this.hashString(userId + tier);
        const percentile = hash % 100;
        let cumulative = 0;
        for (const bucket of buckets) {
            cumulative += bucket.weight;
            if (percentile < cumulative) {
                this.impressions[bucket.priceId].add(userId);
                return bucket;
            }
        }
        return buckets[0];
    }
    /**
     * Get the pricing shown to a specific user (with annual discount displayed).
     */
    getPricingForUser(userId) {
        const proBucket = this.assignPrice(userId, 'pro');
        const eliteBucket = this.assignPrice(userId, 'elite');
        return {
            pro: {
                monthly: proBucket.monthlyPrice,
                annual: proBucket.annualPrice,
                annualMonthlyEquivalent: Math.round(proBucket.annualPrice / 12),
                savingsPercent: Math.round((1 - proBucket.annualPrice / (proBucket.monthlyPrice * 12)) * 100),
            },
            elite: {
                monthly: eliteBucket.monthlyPrice,
                annual: eliteBucket.annualPrice,
                annualMonthlyEquivalent: Math.round(eliteBucket.annualPrice / 12),
                savingsPercent: Math.round((1 - eliteBucket.annualPrice / (eliteBucket.monthlyPrice * 12)) * 100),
            },
        };
    }
    /**
     * Track a conversion at a specific price point.
     */
    trackConversion(userId, tier) {
        const bucket = this.assignPrice(userId, tier);
        this.conversions[bucket.priceId].add(userId);
        this.logger.log(`[PricingTest] Conversion: user=${userId.substring(0, 8)} tier=${tier} price=$${bucket.monthlyPrice}`);
    }
    /**
     * Get complete pricing test results.
     */
    getResults() {
        const proResults = this.bucketResults(PRO_BUCKETS);
        const eliteResults = this.bucketResults(ELITE_BUCKETS);
        // Find optimal price per tier (highest revenue per impression)
        const bestPro = proResults.sort((a, b) => b.revenuePerImpression - a.revenuePerImpression)[0];
        const bestElite = eliteResults.sort((a, b) => b.revenuePerImpression - a.revenuePerImpression)[0];
        // Summary insights
        const parts = [];
        if (bestPro)
            parts.push(`Pro 最优定价: $${bestPro.bucket.monthlyPrice}/月 (RPI: $${bestPro.revenuePerImpression.toFixed(2)})`);
        if (bestElite)
            parts.push(`Elite 最优定价: $${bestElite.bucket.monthlyPrice}/月 (RPI: $${bestElite.revenuePerImpression.toFixed(2)})`);
        if (proResults.length >= 2) {
            const rpiSpread = proResults.map(r => r.revenuePerImpression);
            const maxRpi = Math.max(...rpiSpread);
            const minRpi = Math.min(...rpiSpread.filter(r => r > 0));
            if (minRpi > 0 && maxRpi / minRpi > 1.5) {
                parts.push('⚠️ 价格弹性显著 — 建议进一步细分测试');
            }
        }
        return {
            pro: proResults,
            elite: eliteResults,
            summary: parts.join(' | ') || '等待更多转化数据',
        };
    }
    bucketResults(buckets) {
        return buckets.map(bucket => {
            const imp = this.impressions[bucket.priceId]?.size || 0;
            const conv = this.conversions[bucket.priceId]?.size || 0;
            const rate = imp > 0 ? conv / imp : 0;
            return {
                tier: bucket.tier,
                bucket,
                impressions: imp,
                conversions: conv,
                conversionRate: Math.round(rate * 10000) / 100,
                revenuePerImpression: Math.round(bucket.monthlyPrice * rate * 100) / 100,
                optimalPrice: false, // Set below
            };
        }).map(r => {
            const bestInTier = [...buckets]
                .map(b => {
                const i = this.impressions[b.priceId]?.size || 0;
                const c = this.conversions[b.priceId]?.size || 0;
                return b.monthlyPrice * (i > 0 ? c / i : 0);
            })
                .reduce((max, val) => Math.max(max, val), 0);
            return { ...r, optimalPrice: r.revenuePerImpression >= bestInTier && r.conversions > 0 };
        });
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
};
exports.PricingTestService = PricingTestService;
exports.PricingTestService = PricingTestService = PricingTestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PricingTestService);
//# sourceMappingURL=pricing-test.service.js.map