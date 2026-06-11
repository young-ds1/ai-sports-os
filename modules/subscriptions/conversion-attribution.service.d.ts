/**
 * ConversionAttributionService — measures WHICH feature or trigger drove a conversion.
 *
 * Answers the question: "What made this user pay?"
 * - Was it seeing a prediction preview?
 * - Was it hitting the daily limit?
 * - Was it the tactical analysis teaser?
 * - Was it the decision-value positioning?
 */
interface AttributionEvent {
    userId: string;
    feature: string;
    source: string;
    timestamp: Date;
}
interface ConversionRecord {
    userId: string;
    tier: string;
    priceMonthly: number;
    convertedAt: Date;
    precedingEvents: AttributionEvent[];
    attributedFeature: string;
    attributedSource: string;
    timeFromFirstTrigger: number;
}
export declare class ConversionAttributionService {
    private readonly logger;
    private events;
    private conversions;
    /**
     * Track an attribution event (user saw a teaser, hit a limit, etc.)
     */
    trackEvent(userId: string, feature: string, source: string): void;
    /**
     * Record a conversion and attribute it to preceding events.
     */
    recordConversion(userId: string, tier: string, priceMonthly: number): ConversionRecord;
    /**
     * Get attribution analytics — which features drive the most conversions?
     */
    getAttributionReport(): {
        total_conversions: number;
        by_feature: Record<string, {
            conversions: number;
            percent: number;
            avgTimeToConvert: number;
        }>;
        by_source: Record<string, {
            conversions: number;
            percent: number;
        }>;
        top_conversion_path: string;
        recommendation: string;
    };
}
export {};
//# sourceMappingURL=conversion-attribution.service.d.ts.map