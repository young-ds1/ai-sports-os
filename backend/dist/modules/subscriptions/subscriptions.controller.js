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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_service_1 = require("./subscriptions.service");
const monetization_analytics_service_1 = require("./monetization-analytics.service");
const ab_test_service_1 = require("./ab-test.service");
const preview_teaser_service_1 = require("./preview-teaser.service");
const pricing_test_service_1 = require("./pricing-test.service");
const decision_value_service_1 = require("./decision-value.service");
const conversion_attribution_service_1 = require("./conversion-attribution.service");
const stripe_checkout_service_1 = require("./stripe-checkout.service");
const public_decorator_1 = require("../../shared/decorators/public.decorator");
const tier_config_1 = require("../users/subscriptions/tier-config");
let SubscriptionsController = class SubscriptionsController {
    subscriptionsService;
    monetizationAnalytics;
    abTest;
    previewTeaser;
    pricingTest;
    decisionValue;
    attribution;
    stripe;
    constructor(subscriptionsService, monetizationAnalytics, abTest, previewTeaser, pricingTest, decisionValue, attribution, stripe) {
        this.subscriptionsService = subscriptionsService;
        this.monetizationAnalytics = monetizationAnalytics;
        this.abTest = abTest;
        this.previewTeaser = previewTeaser;
        this.pricingTest = pricingTest;
        this.decisionValue = decisionValue;
        this.attribution = attribution;
        this.stripe = stripe;
    }
    // ── Pricing (with A/B test prices) ──
    async getPricing(req) {
        const userId = req.user?.id || 'anonymous';
        const pricing = this.pricingTest.getPricingForUser(userId);
        const plans = this.subscriptionsService.getPricing();
        // Override plan prices with A/B test bucket prices
        const personalized = plans.map(p => {
            if (p.tier === tier_config_1.SubscriptionTier.VIP) {
                return { ...p, price: `$${pricing.pro.monthly}/月`, annual_price: `$${pricing.pro.annual}/年`, price_test_bucket: 'active' };
            }
            if (p.tier === tier_config_1.SubscriptionTier.PRO) {
                return { ...p, price: `$${pricing.elite.monthly}/月`, annual_price: `$${pricing.elite.annual}/年`, price_test_bucket: 'active' };
            }
            return p;
        });
        return { data: personalized };
    }
    // ── Upgrade Page (decision-system positioning) ──
    async getUpgradePage(req) {
        const userId = req.user?.id || 'anonymous';
        const page = this.decisionValue.buildUpgradePage(userId);
        return { data: page };
    }
    // ── Checkout ──
    async createCheckout(body, req) {
        const userId = req.user?.id || 'anonymous';
        const pricing = this.pricingTest.getPricingForUser(userId);
        const tier = body.tier === 'pro' ? 'pro' : 'elite';
        const price = tier === 'pro' ? pricing.pro : pricing.elite;
        const monthlyPrice = body.billing === 'annual' ? price.annualMonthlyEquivalent : price.monthly;
        const bucket = this.pricingTest.assignPrice(userId, tier);
        const session = await this.stripe.createCheckout({
            userId,
            tier,
            priceId: bucket.priceId,
            monthlyPrice,
            successUrl: body.successUrl || `${process.env.APP_URL || 'http://localhost:3000'}/user/upgrade/success`,
            cancelUrl: body.cancelUrl || `${process.env.APP_URL || 'http://localhost:3000'}/user/upgrade`,
        });
        return { data: session };
    }
    async verifyCheckout(body, req) {
        const userId = req.user?.id || 'anonymous';
        const result = await this.stripe.verifySession(body.sessionId);
        if (result.success) {
            const tier = result.tier;
            await this.subscriptionsService.create({ userId, tier });
            this.pricingTest.trackConversion(userId, tier === tier_config_1.SubscriptionTier.PRO ? 'elite' : 'pro');
            this.abTest.trackConversion(userId);
            this.attribution.recordConversion(userId, tier, result.amount || 0);
            this.monetizationAnalytics.trackSignal({ userId, type: 'subscription_start', feature: tier, source: 'checkout' });
        }
        return { data: result };
    }
    // ── Subscription management ──
    async upgrade(body, req) {
        const userId = req.user?.id || 'anonymous';
        const tier = body.tier;
        const sub = await this.subscriptionsService.create({ userId, tier });
        this.abTest.trackConversion(userId);
        this.pricingTest.trackConversion(userId, tier === tier_config_1.SubscriptionTier.PRO ? 'elite' : 'pro');
        this.attribution.recordConversion(userId, tier, 9); // default price
        this.monetizationAnalytics.trackSignal({ userId, type: 'subscription_start', feature: tier, source: body.source || 'api' });
        return { data: { subscription: sub, message: `Successfully upgraded to ${tier.toUpperCase()}!` } };
    }
    async cancel(req) {
        const userId = req.user?.id || 'anonymous';
        await this.subscriptionsService.cancel(userId);
        this.monetizationAnalytics.trackSignal({ userId, type: 'subscription_cancel' });
        return { data: { message: 'Subscription cancelled' } };
    }
    async getStatus(req) {
        const userId = req.user?.id || 'anonymous';
        const tier = this.subscriptionsService.getUserTier(userId);
        const abGroup = this.abTest.assignGroup(userId);
        const abConfig = this.abTest.shouldShowTeasers(userId);
        const pricing = this.pricingTest.getPricingForUser(userId);
        return {
            data: {
                tier,
                ab_group: abGroup,
                show_teasers: abConfig.show,
                teaser_timing: abConfig.timing,
                personalized_pricing: pricing,
            },
        };
    }
    // ── Teaser Previews ──
    async getPreviews() {
        return { data: this.previewTeaser.getAllTeasers() };
    }
    // ── Contextual CTA ──
    async getContextualCTA(trigger, req) {
        const userId = req.user?.id || 'anonymous';
        const pricing = this.pricingTest.getPricingForUser(userId);
        const cta = this.decisionValue.getContextualCTA(trigger, { monthly: pricing.pro.monthly });
        return { data: cta };
    }
    // ── Analytics ──
    async getMonetizationDashboard() {
        return { data: this.monetizationAnalytics.getDashboard() };
    }
    async getABTestResults() {
        return { data: this.abTest.getResults() };
    }
    async getPricingTestResults() {
        return { data: this.pricingTest.getResults() };
    }
    async getAttributionReport() {
        return { data: this.attribution.getAttributionReport() };
    }
    // ── Signal Tracking ──
    async trackSignal(body, req) {
        const userId = req.user?.id || 'anonymous';
        this.monetizationAnalytics.trackSignal({ userId, type: body.type, feature: body.feature, source: body.source });
        this.attribution.trackEvent(userId, body.feature || 'unknown', body.source || 'api');
        return { status: 'ok' };
    }
    // ── Billing Audit Trail ──
    async getBilling(userId) {
        return { data: this.subscriptionsService.getBillingSummary() };
    }
    async getBillingEvents(userId) {
        return { data: this.subscriptionsService.getBillingEvents(userId) };
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('pricing'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getPricing", null);
__decorate([
    (0, common_1.Get)('upgrade-page'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getUpgradePage", null);
__decorate([
    (0, common_1.Post)('checkout'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Post)('checkout/verify'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "verifyCheckout", null);
__decorate([
    (0, common_1.Post)('upgrade'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "upgrade", null);
__decorate([
    (0, common_1.Post)('cancel'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('previews'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getPreviews", null);
__decorate([
    (0, common_1.Get)('cta'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('trigger')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getContextualCTA", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getMonetizationDashboard", null);
__decorate([
    (0, common_1.Get)('ab-test/results'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getABTestResults", null);
__decorate([
    (0, common_1.Get)('pricing-test/results'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getPricingTestResults", null);
__decorate([
    (0, common_1.Get)('attribution'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getAttributionReport", null);
__decorate([
    (0, common_1.Post)('signal'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "trackSignal", null);
__decorate([
    (0, common_1.Get)('billing'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getBilling", null);
__decorate([
    (0, common_1.Get)('billing/events'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getBillingEvents", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('api/subscriptions'),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService,
        monetization_analytics_service_1.MonetizationAnalyticsService,
        ab_test_service_1.ABTestService,
        preview_teaser_service_1.PreviewTeaserService,
        pricing_test_service_1.PricingTestService,
        decision_value_service_1.DecisionValueService,
        conversion_attribution_service_1.ConversionAttributionService,
        stripe_checkout_service_1.StripeCheckoutService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map