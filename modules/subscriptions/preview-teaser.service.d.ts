/**
 * PreviewTeaserService — generates the "locked content preview" that Free users see.
 *
 * Key principle: Show the STRUCTURE of what Pro unlocks without giving the VALUE.
 * Like a blurred image preview — you see there's something there, but you can't read it.
 *
 * Three types of teasers:
 * 1. BlurPreview — shows section headers with lock icons
 * 2. StatPreview — shows labels without values
 * 3. TrendPreview — shows axis labels without the chart
 */
export interface TeaserSection {
    title: string;
    icon: string;
    description: string;
    freePreview: string;
    proValue: string;
    conversionHook: string;
}
export declare class PreviewTeaserService {
    private teasers;
    /**
     * Generate a teaser block for a specific feature category.
     */
    getTeaser(category: string): TeaserSection | null;
    /**
     * Generate a complete "upgrade prompt" card with multiple teasers.
     */
    getUpgradePrompt(unlockedCount: number, totalCount: number): string;
    /**
     * Generate a teaser response for when a Free user hits a premium question.
     * This is appended to their AI response.
     */
    buildPaywallResponse(triggerCategory: string): {
        message: string;
        teaser: TeaserSection;
        cta: {
            text: string;
            url: string;
            urgency: 'low' | 'medium' | 'high';
        };
    };
    /**
     * Get all teaser sections (for the upgrade page).
     */
    getAllTeasers(): TeaserSection[];
}
//# sourceMappingURL=preview-teaser.service.d.ts.map