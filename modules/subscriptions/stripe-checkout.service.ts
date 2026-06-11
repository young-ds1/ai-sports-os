import { Injectable, Logger } from '@nestjs/common';

/**
 * StripeCheckoutService — mock/facade for payment processing.
 *
 * MVP (Phase 2): Returns mock checkout URLs for development.
 * Production (Phase 4): Replace with real Stripe SDK integration.
 *
 * Design: All payment logic goes through this service.
 * No Stripe SDK import anywhere else in the codebase.
 */

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  tier: string;
  priceId: string;
  monthlyPrice: number;
  currency: string;
  mode: 'subscription' | 'payment';
}

@Injectable()
export class StripeCheckoutService {
  private readonly logger = new Logger(StripeCheckoutService.name);

  /**
   * Create a checkout session for subscription upgrade.
   * MVP: Returns mock URL. Phase 4: Stripe API.
   */
  async createCheckout(params: {
    userId: string;
    tier: 'pro' | 'elite';
    priceId: string;
    monthlyPrice: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // MVP: Mock checkout — redirects to success page directly
    const isMockMode = !process.env.STRIPE_SECRET_KEY;

    if (isMockMode) {
      this.logger.log(
        `[Stripe Mock] Creating checkout: user=${params.userId.substring(0, 8)} ` +
        `tier=${params.tier} price=$${params.monthlyPrice}`,
      );

      return {
        sessionId,
        checkoutUrl: `${params.successUrl}?session_id=${sessionId}&mock=true`,
        tier: params.tier,
        priceId: params.priceId,
        monthlyPrice: params.monthlyPrice,
        currency: 'usd',
        mode: 'subscription',
      };
    }

    // Phase 4: Real Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const session = await stripe.checkout.sessions.create({...});
    throw new Error('Stripe integration not yet configured. Set STRIPE_SECRET_KEY.');
  }

  /**
   * Verify a checkout session was completed successfully.
   */
  async verifySession(sessionId: string): Promise<{
    success: boolean;
    userId?: string;
    tier?: string;
    amount?: number;
  }> {
    // MVP: All mock sessions succeed
    if (sessionId.includes('mock=true') || !process.env.STRIPE_SECRET_KEY) {
      return { success: true, tier: 'pro', amount: 9 };
    }

    // Phase 4: Real Stripe verification
    throw new Error('Stripe integration not yet configured.');
  }
}
