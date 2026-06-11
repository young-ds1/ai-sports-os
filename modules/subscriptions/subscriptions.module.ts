import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { TieredResponseService } from './tiered-response.service';
import { PaywallTriggerService } from './paywall-trigger.service';
import { PreviewTeaserService } from './preview-teaser.service';
import { ABTestService } from './ab-test.service';
import { MonetizationAnalyticsService } from './monetization-analytics.service';
import { PricingTestService } from './pricing-test.service';
import { DecisionValueService } from './decision-value.service';
import { ConversionAttributionService } from './conversion-attribution.service';
import { StripeCheckoutService } from './stripe-checkout.service';
import { SubscriptionsController } from './subscriptions.controller';

const SERVICES = [
  // Tier & Paywall
  SubscriptionsService,
  TieredResponseService,
  PaywallTriggerService,
  PreviewTeaserService,
  // Testing & Optimization
  ABTestService,
  PricingTestService,
  DecisionValueService,
  // Analytics & Attribution
  MonetizationAnalyticsService,
  ConversionAttributionService,
  // Payment
  StripeCheckoutService,
];

@Module({
  controllers: [SubscriptionsController],
  providers: SERVICES,
  exports: SERVICES,
})
export class SubscriptionsModule {}
