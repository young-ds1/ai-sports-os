interface UtmParams {
    platform: string;
    contentId: string;
    contentType: string;
    referenceId?: string;
    campaign?: string;
}
export declare class UtmBuilderService {
    private readonly baseUrl;
    /**
     * Build a fully tracked URL for content distribution.
     *
     * UTM parameters:
     * - utm_source: platform name (xiaohongshu, twitter, wechat, douyin, seo)
     * - utm_medium: content (all content is content marketing)
     * - utm_campaign: content type + date (post_match_2026-06-12)
     * - utm_content: unique content ID for cross-platform tracking
     * - utm_term: match/team/player reference
     */
    build(params: UtmParams): string;
    /**
     * Build UTM for the generic landing page with AI analysis CTA.
     */
    buildLandingPage(params: UtmParams): string;
    private dateSlug;
}
export {};
//# sourceMappingURL=utm-builder.service.d.ts.map