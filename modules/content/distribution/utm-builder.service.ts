import { Injectable } from '@nestjs/common';

interface UtmParams {
  platform: string;
  contentId: string;
  contentType: string;
  referenceId?: string;
  campaign?: string;
}

@Injectable()
export class UtmBuilderService {
  private readonly baseUrl = process.env.APP_URL || 'https://aisportsos.com';

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
  build(params: UtmParams): string {
    const url = new URL(this.baseUrl);

    url.searchParams.set('utm_source', params.platform);
    url.searchParams.set('utm_medium', 'content');
    url.searchParams.set('utm_campaign', `${params.contentType}_${this.dateSlug()}`);
    url.searchParams.set('utm_content', params.contentId);

    if (params.referenceId) {
      url.searchParams.set('utm_term', params.referenceId.substring(0, 8));
    }

    // If it's a match-related content, deep-link to the match page
    if (params.contentType.includes('match') && params.referenceId) {
      url.pathname = `/matches/${params.referenceId}`;
    }

    return url.toString();
  }

  /**
   * Build UTM for the generic landing page with AI analysis CTA.
   */
  buildLandingPage(params: UtmParams): string {
    const url = new URL(this.baseUrl);
    url.searchParams.set('utm_source', params.platform);
    url.searchParams.set('utm_medium', 'content');
    url.searchParams.set('utm_campaign', params.campaign || 'evergreen');
    url.searchParams.set('utm_content', params.contentId);
    url.searchParams.set('ref', 'content');
    return url.toString();
  }

  private dateSlug(): string {
    return new Date().toISOString().split('T')[0];
  }
}
