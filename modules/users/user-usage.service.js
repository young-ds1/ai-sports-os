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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserUsageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_usage_entity_1 = require("./user-usage.entity");
let UserUsageService = class UserUsageService {
    usageRepo;
    constructor(usageRepo) {
        this.usageRepo = usageRepo;
    }
    async track(data) {
        const usage = this.usageRepo.create({
            user_id: data.userId,
            action: data.action,
            entity_type: data.entityType,
            entity_id: data.entityId,
            session_id: data.sessionId,
            latency_ms: data.latencyMs,
        });
        return this.usageRepo.save(usage);
    }
    async getTodayUsage(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.usageRepo.count({
            where: {
                user_id: userId,
                action: 'ai_analysis_request',
                created_at: (0, typeorm_2.Between)(today, tomorrow),
            },
        });
    }
    async getTodayUsageBreakdown(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const rows = await this.usageRepo
            .createQueryBuilder('usage')
            .select('usage.action', 'action')
            .addSelect('COUNT(*)', 'count')
            .where('usage.user_id = :userId', { userId })
            .andWhere('usage.created_at >= :today', { today })
            .andWhere('usage.created_at < :tomorrow', { tomorrow })
            .groupBy('usage.action')
            .getRawMany();
        const breakdown = {
            ai_analysis_request: 0,
            ai_chat_message: 0,
            ai_prediction_request: 0,
        };
        for (const row of rows) {
            breakdown[row.action] = parseInt(row.count, 10);
        }
        return breakdown;
    }
    async getTopMatches(limit = 10, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return this.usageRepo
            .createQueryBuilder('usage')
            .select('usage.entity_id', 'entity_id')
            .addSelect('COUNT(*)', 'views')
            .where('usage.action = :action', { action: 'view_match' })
            .andWhere('date(usage.created_at) = :date', { date: targetDate })
            .groupBy('usage.entity_id')
            .orderBy('views', 'DESC')
            .limit(limit)
            .getRawMany();
    }
    async getDailyActiveUsers(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const result = await this.usageRepo
            .createQueryBuilder('usage')
            .select('COUNT(DISTINCT usage.user_id)', 'count')
            .where('date(usage.created_at) = :date', { date: targetDate })
            .getRawOne();
        return parseInt(result?.count || '0', 10);
    }
    async getAiRequestsPerDau(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const result = await this.usageRepo
            .createQueryBuilder('usage')
            .select('CAST(COUNT(*) AS REAL) / MAX(COUNT(DISTINCT usage.user_id), 1)', 'ratio')
            .where('usage.action IN (:...actions)', { actions: ['ai_analysis_request', 'ai_chat_message'] })
            .andWhere('date(usage.created_at) = :date', { date: targetDate })
            .getRawOne();
        return result?.ratio || 0;
    }
};
exports.UserUsageService = UserUsageService;
exports.UserUsageService = UserUsageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_usage_entity_1.UserUsage)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], UserUsageService);
//# sourceMappingURL=user-usage.service.js.map