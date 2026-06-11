"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StripeCheckoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeCheckoutService = void 0;
const common_1 = require("@nestjs/common");
let StripeCheckoutService = StripeCheckoutService_1 = class StripeCheckoutService {
    logger = new common_1.Logger(StripeCheckoutService_1.name);
    /**
     * Create a checkout session for subscription upgrade.
     * MVP: Returns mock URL. Phase 4: Stripe API.
     */
    async createCheckout(params) {
        const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        // MVP: Mock checkout — redirects to success page directly
        const isMockMode = !process.env.STRIPE_SECRET_KEY;
        if (isMockMode) {
            this.logger.log(`[Stripe Mock] Creating checkout: user=${params.userId.substring(0, 8)} ` +
                `tier=${params.tier} price=$${params.monthlyPrice}`);
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
    async verifySession(sessionId) {
        // MVP: All mock sessions succeed
        if (sessionId.includes('mock=true') || !process.env.STRIPE_SECRET_KEY) {
            return { success: true, tier: 'pro', amount: 9 };
        }
        // Phase 4: Real Stripe verification
        throw new Error('Stripe integration not yet configured.');
    }
};
exports.StripeCheckoutService = StripeCheckoutService;
exports.StripeCheckoutService = StripeCheckoutService = StripeCheckoutService_1 = __decorate([
    (0, common_1.Injectable)()
], StripeCheckoutService);
//# sourceMappingURL=stripe-checkout.service.js.map