"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EngagementTrackerService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementTrackerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const content_output_entity_1 = require("../entities/content-output.entity");
let EngagementTrackerService = EngagementTrackerService_1 = class EngagementTrackerService {
    outputRepo;
    logger = new common_1.Logger(EngagementTrackerService_1.name);
    conversionCache = new Map(); // contentId → attributions
    constructor(outputRepo) {
        this.outputRepo = outputRepo;
    }
    /**
     * Update engagement metrics for a content output.
     * Called by webhook or manual data entry.
     */
    async updateEngagement(update) {
        const output = await this.outputRepo.findOne({
            where: { content_id: update.contentId, platform: update.platform },
        });
        if (!output) {
            this.logger.warn(`[Engagement] Content not found: ${update.contentId} on ${update.platform}`);
            return;
        }
        const currentEngagement = (output.engagement || {});
        currentEngagement[update.metric] = update.value;
        await this.outputRepo.update(output.id, {
            engagement: currentEngagement,
        });
        this.logger.log(`[Engagement] ${update.platform}/${update.contentId}: ${update.metric}=${update.value}`);
    }
    /**
     * Track a user conversion attributed to a specific content piece.
     */
    trackConversion(attribution) {
        if (!this.conversionCache.has(attribution.contentId)) {
            this.conversionCache.set(attribution.contentId, []);
        }
        this.conversionCache.get(attribution.contentId).push(attribution);
        // Update the content output's conversion count
        this.outputRepo
            .createQueryBuilder()
            .update(content_output_entity_1.ContentOutput)
            .set({
            engagement: () => `engagement || '{"conversions": ${(this.conversionCache.get(attribution.contentId)?.length || 1)}}'::jsonb`,
        })
            .where('content_id = :contentId', { contentId: attribution.contentId })
            .execute()
            .catch(() => { }); // Fire-and-forget
    }
    /**
     * Get conversion attribution report.
     */
    getAttributionReport(days = 30) {
        const byPlatform = {};
        const byType = {};
        // Aggregate from conversionCache
        for (const [contentId, attributions] of this.conversionCache) {
            for (const attr of attributions) {
                if (!byPlatform[attr.utmSource]) {
                    byPlatform[attr.utmSource] = { clicks: 0, conversions: 0, conversionRate: 0 };
                }
                byPlatform[attr.utmSource].conversions++;
            }
        }
        return {
            by_platform: byPlatform,
            by_content_type: byType,
        };
    }
};
exports.EngagementTrackerService = EngagementTrackerService;
exports.EngagementTrackerService = EngagementTrackerService = EngagementTrackerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_output_entity_1.ContentOutput)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], EngagementTrackerService);
//# sourceMappingURL=engagement-tracker.service.js.map