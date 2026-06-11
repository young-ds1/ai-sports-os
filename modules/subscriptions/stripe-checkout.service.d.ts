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
export declare class StripeCheckoutService {
    private readonly logger;
    /**
     * Create a checkout session for subscription upgrade.
     * MVP: Returns mock URL. Phase 4: Stripe API.
     */
    createCheckout(params: {
        userId: string;
        tier: 'pro' | 'elite';
        priceId: string;
        monthlyPrice: number;
        successUrl: string;
        cancelUrl: string;
    }): Promise<CheckoutSession>;
    /**
     * Verify a checkout session was completed successfully.
     */
    verifySession(sessionId: string): Promise<{
        success: boolean;
        userId?: string;
        tier?: string;
        amount?: number;
    }>;
}
//# sourceMappingURL=stripe-checkout.service.d.ts.map