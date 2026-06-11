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
var DistributionService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const content_output_entity_1 = require("../entities/content-output.entity");
const content_task_entity_1 = require("../entities/content-task.entity");
let DistributionService = DistributionService_1 = class DistributionService {
    outputRepo;
    taskRepo;
    logger = new common_1.Logger(DistributionService_1.name);
    constructor(outputRepo, taskRepo) {
        this.outputRepo = outputRepo;
        this.taskRepo = taskRepo;
    }
    /**
     * Mark a content output as published on a platform.
     * This is called manually after the operator publishes the content.
     * Phase 3 MVP: Manual publish. Phase 4: API-based auto-publish.
     */
    async recordPublish(record) {
        await this.outputRepo.update(record.outputId, {
            published_at: record.publishedAt,
            published_url: record.publishedUrl,
        });
        // Check if all outputs for the task are published
        const output = await this.outputRepo.findOne({
            where: { id: record.outputId },
            relations: ['task'],
        });
        if (output?.task_id) {
            const allOutputs = await this.outputRepo.find({
                where: { task_id: output.task_id },
            });
            const allPublished = allOutputs.every(o => o.published_at != null || o.id === record.outputId);
            if (allPublished && allOutputs.length > 0) {
                await this.taskRepo.update(output.task_id, { status: content_task_entity_1.ContentStatus.PUBLISHED });
                this.logger.log(`[Distribution] Task ${output.task_id} fully published`);
            }
        }
    }
    /**
     * Get pending content ready for manual publishing.
     */
    async getPendingOutputs(platform) {
        const where = { published_at: null };
        if (platform)
            where.platform = platform;
        return this.outputRepo.find({ where, order: { generated_at: 'DESC' }, take: 50 });
    }
    /**
     * Get content performance across platforms.
     */
    async getContentPerformance(days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const outputs = await this.outputRepo
            .createQueryBuilder('output')
            .where('output.generated_at >= :since', { since })
            .getMany();
        const byPlatform = {};
        for (const o of outputs) {
            if (!byPlatform[o.platform]) {
                byPlatform[o.platform] = { total: 0, published: 0, total_engagement: 0 };
            }
            byPlatform[o.platform].total++;
            if (o.published_at) {
                byPlatform[o.platform].published++;
                const engagement = o.engagement || {};
                byPlatform[o.platform].total_engagement +=
                    (engagement.views || 0) + (engagement.likes || 0) * 2 + (engagement.shares || 0) * 5;
            }
        }
        return {
            total_outputs: outputs.length,
            published: outputs.filter(o => o.published_at).length,
            by_platform: byPlatform,
        };
    }
};
exports.DistributionService = DistributionService;
exports.DistributionService = DistributionService = DistributionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_output_entity_1.ContentOutput)),
    __param(1, (0, typeorm_1.InjectRepository)(content_task_entity_1.ContentTask)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], DistributionService);
//# sourceMappingURL=distribution.service.js.map