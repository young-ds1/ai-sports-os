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
var DistributionAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributionAgentService = void 0;
const common_1 = require("@nestjs/common");
const distribution_service_1 = require("../../content/distribution/distribution.service");
const content_service_1 = require("../../content/content.service");
// Platform best-times in UTC
const PLATFORM_BEST_TIMES = {
    xiaohongshu: '12:00', // 20:00 Beijing
    twitter: '01:00', // US evening
    wechat: '12:30', // 20:30 Beijing
    douyin: '12:00', // 20:00 Beijing
    seo: '06:00', // Early morning
};
let DistributionAgentService = DistributionAgentService_1 = class DistributionAgentService {
    distributionService;
    contentService;
    logger = new common_1.Logger(DistributionAgentService_1.name);
    constructor(distributionService, contentService) {
        this.distributionService = distributionService;
        this.contentService = contentService;
    }
    /**
     * Decide distribution plan based on strategy.
     */
    async execute(strategy) {
        const pending = await this.distributionService.getPendingOutputs();
        const decisions = [];
        let totalPublished = 0;
        // Group pending content by platform
        const byPlatform = new Map();
        for (const output of pending) {
            byPlatform.set(output.platform, (byPlatform.get(output.platform) || 0) + 1);
        }
        // Build distribution decisions
        for (const [platform, count] of byPlatform) {
            const isFocusChannel = platform === strategy.growthDirective.focusChannel;
            const bestTime = PLATFORM_BEST_TIMES[platform] || '12:00';
            decisions.push({
                platform,
                outputCount: count,
                bestTime,
                priority: isFocusChannel ? 'high' : count > 5 ? 'medium' : 'low',
                reason: isFocusChannel
                    ? `Strategy focus channel — publish all immediately`
                    : `Queue for best-time window (${bestTime} UTC)`,
            });
            // Auto-publish for high priority, mock the action
            if (isFocusChannel) {
                const platformOutputs = pending.filter(o => o.platform === platform);
                for (const output of platformOutputs.slice(0, 5)) { // Limit 5 per cycle
                    try {
                        await this.distributionService.recordPublish({
                            outputId: output.id,
                            platform,
                            publishedUrl: `https://${platform}.com/ai-sports-os/${output.content_id}`,
                            publishedAt: new Date(),
                            status: 'published',
                        });
                        totalPublished++;
                    }
                    catch (err) {
                        this.logger.warn(`[DistributionAgent] Failed to publish ${output.id}: ${err.message}`);
                    }
                }
            }
        }
        // Sort: high priority first
        decisions.sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.priority] - order[b.priority];
        });
        const report = {
            timestamp: new Date(),
            decisions,
            totalPending: pending.length,
            totalPublished,
            focusChannel: strategy.growthDirective.focusChannel,
            nextPublishWindow: decisions.length > 0
                ? `${decisions[0].bestTime} UTC (${decisions[0].platform})`
                : 'No pending content',
            summary: totalPublished > 0
                ? `自动发布 ${totalPublished} 条内容到 ${strategy.growthDirective.focusChannel}，${pending.length - totalPublished} 条排队中`
                : `${pending.length} 条内容排队等待最佳发布时间`,
        };
        this.logger.log(`[DistributionAgent] ${report.summary}`);
        return report;
    }
};
exports.DistributionAgentService = DistributionAgentService;
exports.DistributionAgentService = DistributionAgentService = DistributionAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [distribution_service_1.DistributionService,
        content_service_1.ContentService])
], DistributionAgentService);
//# sourceMappingURL=distribution-agent.service.js.map