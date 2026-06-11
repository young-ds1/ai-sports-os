import { Repository } from 'typeorm';
import { ContentOutput } from '../entities/content-output.entity';
interface EngagementUpdate {
    contentId: string;
    platform: string;
    metric: 'views' | 'likes' | 'shares' | 'comments' | 'clicks' | 'conversions';
    value: number;
}
interface ConversionAttribution {
    userId: string;
    contentId: string;
    utmSource: string;
    utmCampaign: string;
    convertedAt: Date;
}
export declare class EngagementTrackerService {
    private readonly outputRepo;
    private readonly logger;
    private conversionCache;
    constructor(outputRepo: Repository<ContentOutput>);
    /**
     * Update engagement metrics for a content output.
     * Called by webhook or manual data entry.
     */
    updateEngagement(update: EngagementUpdate): Promise<void>;
    /**
     * Track a user conversion attributed to a specific content piece.
     */
    trackConversion(attribution: ConversionAttribution): void;
    /**
     * Get conversion attribution report.
     */
    getAttributionReport(days?: number): {
        by_platform: Record<string, {
            clicks: number;
            conversions: number;
            conversionRate: number;
        }>;
        by_content_type: Record<string, {
            pieces: number;
            conversions: number;
        }>;
    };
}
export {};
//# sourceMappingURL=engagement-tracker.service.d.ts.map