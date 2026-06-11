"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_service_1 = require("./subscriptions.service");
const tiered_response_service_1 = require("./tiered-response.service");
const paywall_trigger_service_1 = require("./paywall-trigger.service");
const preview_teaser_service_1 = require("./preview-teaser.service");
const ab_test_service_1 = require("./ab-test.service");
const monetization_analytics_service_1 = require("./monetization-analytics.service");
const pricing_test_service_1 = require("./pricing-test.service");
const decision_value_service_1 = require("./decision-value.service");
const conversion_attribution_service_1 = require("./conversion-attribution.service");
const stripe_checkout_service_1 = require("./stripe-checkout.service");
const subscriptions_controller_1 = require("./subscriptions.controller");
const SERVICES = [
    // Tier & Paywall
    subscriptions_service_1.SubscriptionsService,
    tiered_response_service_1.TieredResponseService,
    paywall_trigger_service_1.PaywallTriggerService,
    preview_teaser_service_1.PreviewTeaserService,
    // Testing & Optimization
    ab_test_service_1.ABTestService,
    pricing_test_service_1.PricingTestService,
    decision_value_service_1.DecisionValueService,
    // Analytics & Attribution
    monetization_analytics_service_1.MonetizationAnalyticsService,
    conversion_attribution_service_1.ConversionAttributionService,
    // Payment
    stripe_checkout_service_1.StripeCheckoutService,
];
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        controllers: [subscriptions_controller_1.SubscriptionsController],
        providers: SERVICES,
        exports: SERVICES,
    })
], SubscriptionsModule);
//# sourceMappingURL=subscriptions.module.js.map