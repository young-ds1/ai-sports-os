import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { MonetizationAnalyticsService } from './monetization-analytics.service';
import { ABTestService } from './ab-test.service';
import { PreviewTeaserService } from './preview-teaser.service';
import { PricingTestService } from './pricing-test.service';
import { DecisionValueService } from './decision-value.service';
import { ConversionAttributionService } from './conversion-attribution.service';
import { StripeCheckoutService } from './stripe-checkout.service';
import { Public } from '../../shared/decorators/public.decorator';
import { SubscriptionTier } from '../users/subscriptions/tier-config';

@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly monetizationAnalytics: MonetizationAnalyticsService,
    private readonly abTest: ABTestService,
    private readonly previewTeaser: PreviewTeaserService,
    private readonly pricingTest: PricingTestService,
    private readonly decisionValue: DecisionValueService,
    private readonly attribution: ConversionAttributionService,
    private readonly stripe: StripeCheckoutService,
  ) {}

  // ── Pricing (with A/B test prices) ──

  @Get('pricing')
  @Public()
  async getPricing(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const pricing = this.pricingTest.getPricingForUser(userId);
    const plans = this.subscriptionsService.getPricing();

    // Override plan prices with A/B test bucket prices
    const personalized = plans.map(p => {
      if (p.tier === SubscriptionTier.VIP) {
        return { ...p, price: `$${pricing.pro.monthly}/月`, annual_price: `$${pricing.pro.annual}/年`, price_test_bucket: 'active' };
      }
      if (p.tier === SubscriptionTier.PRO) {
        return { ...p, price: `$${pricing.elite.monthly}/月`, annual_price: `$${pricing.elite.annual}/年`, price_test_bucket: 'active' };
      }
      return p;
    });

    return { data: personalized };
  }

  // ── Upgrade Page (decision-system positioning) ──

  @Get('upgrade-page')
  @Public()
  async getUpgradePage(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const page = this.decisionValue.buildUpgradePage(userId);
    return { data: page };
  }

  // ── Checkout ──

  @Post('checkout')
  @Public()
  async createCheckout(@Body() body: {
    tier: 'pro' | 'elite';
    billing: 'monthly' | 'annual';
    successUrl?: string;
    cancelUrl?: string;
  }, @Req() req: any) {
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

  @Post('checkout/verify')
  @Public()
  async verifyCheckout(@Body() body: { sessionId: string }, @Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const result = await this.stripe.verifySession(body.sessionId);

    if (result.success) {
      const tier = result.tier as SubscriptionTier;
      await this.subscriptionsService.create({ userId, tier });
      this.pricingTest.trackConversion(userId, tier === SubscriptionTier.PRO ? 'elite' : 'pro');
      this.abTest.trackConversion(userId);
      this.attribution.recordConversion(userId, tier, result.amount || 0);
      this.monetizationAnalytics.trackSignal({ userId, type: 'subscription_start', feature: tier, source: 'checkout' });
    }

    return { data: result };
  }

  // ── Subscription management ──

  @Post('upgrade')
  @Public()
  async upgrade(@Body() body: { tier: string; source?: string }, @Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const tier = body.tier as SubscriptionTier;
    const sub = await this.subscriptionsService.create({ userId, tier });

    this.abTest.trackConversion(userId);
    this.pricingTest.trackConversion(userId, tier === SubscriptionTier.PRO ? 'elite' : 'pro');
    this.attribution.recordConversion(userId, tier, 9); // default price
    this.monetizationAnalytics.trackSignal({ userId, type: 'subscription_start', feature: tier, source: body.source || 'api' });

    return { data: { subscription: sub, message: `Successfully upgraded to ${tier.toUpperCase()}!` } };
  }

  @Post('cancel')
  @Public()
  async cancel(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    await this.subscriptionsService.cancel(userId);
    this.monetizationAnalytics.trackSignal({ userId, type: 'subscription_cancel' });
    return { data: { message: 'Subscription cancelled' } };
  }

  @Get('status')
  @Public()
  async getStatus(@Req() req: any) {
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

  @Get('previews')
  @Public()
  async getPreviews() {
    return { data: this.previewTeaser.getAllTeasers() };
  }

  // ── Contextual CTA ──

  @Get('cta')
  @Public()
  async getContextualCTA(@Query('trigger') trigger: string, @Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    const pricing = this.pricingTest.getPricingForUser(userId);
    const cta = this.decisionValue.getContextualCTA(trigger, { monthly: pricing.pro.monthly });
    return { data: cta };
  }

  // ── Analytics ──

  @Get('analytics')
  @Public()
  async getMonetizationDashboard() {
    return { data: this.monetizationAnalytics.getDashboard() };
  }

  @Get('ab-test/results')
  @Public()
  async getABTestResults() {
    return { data: this.abTest.getResults() };
  }

  @Get('pricing-test/results')
  @Public()
  async getPricingTestResults() {
    return { data: this.pricingTest.getResults() };
  }

  @Get('attribution')
  @Public()
  async getAttributionReport() {
    return { data: this.attribution.getAttributionReport() };
  }

  // ── Signal Tracking ──

  @Post('signal')
  @Public()
  async trackSignal(@Body() body: {
    type: 'upgrade_click' | 'pricing_view' | 'feature_preview_click' | 'daily_limit_hit';
    feature?: string;
    source?: string;
  }, @Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    this.monetizationAnalytics.trackSignal({ userId, type: body.type, feature: body.feature, source: body.source });
    this.attribution.trackEvent(userId, body.feature || 'unknown', body.source || 'api');
    return { status: 'ok' };
  }

  // ── Billing Audit Trail ──

  @Get('billing')
  @Public()
  async getBilling(@Query('userId') userId?: string) {
    return { data: this.subscriptionsService.getBillingSummary() };
  }

  @Get('billing/events')
  @Public()
  async getBillingEvents(@Query('userId') userId?: string) {
    return { data: this.subscriptionsService.getBillingEvents(userId) };
  }
}
