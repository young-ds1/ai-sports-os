"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtmBuilderService = void 0;
const common_1 = require("@nestjs/common");
let UtmBuilderService = class UtmBuilderService {
    baseUrl = process.env.APP_URL || 'https://aisportsos.com';
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
    build(params) {
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
    buildLandingPage(params) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('utm_source', params.platform);
        url.searchParams.set('utm_medium', 'content');
        url.searchParams.set('utm_campaign', params.campaign || 'evergreen');
        url.searchParams.set('utm_content', params.contentId);
        url.searchParams.set('ref', 'content');
        return url.toString();
    }
    dateSlug() {
        return new Date().toISOString().split('T')[0];
    }
};
exports.UtmBuilderService = UtmBuilderService;
exports.UtmBuilderService = UtmBuilderService = __decorate([
    (0, common_1.Injectable)()
], UtmBuilderService);
//# sourceMappingURL=utm-builder.service.js.map