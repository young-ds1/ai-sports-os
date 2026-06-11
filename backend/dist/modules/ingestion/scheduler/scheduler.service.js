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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const match_sync_service_1 = require("../sync/match-sync.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    matchSync;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(matchSync) {
        this.matchSync = matchSync;
    }
    // Sync fixtures every 5 minutes
    async syncFixtures() {
        this.logger.log('Syncing fixtures...');
        try {
            const today = new Date().toISOString().split('T')[0];
            await this.matchSync.syncFixtures('api-football', today);
            this.logger.log('Fixtures synced successfully');
        }
        catch (err) {
            this.logger.error('Failed to sync fixtures', err);
        }
    }
    // Sync live matches every minute
    async syncLiveMatches() {
        try {
            await this.matchSync.syncLiveMatches('api-football');
        }
        catch (err) {
            this.logger.error('Failed to sync live matches', err);
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "syncFixtures", null);
__decorate([
    (0, schedule_1.Cron)('* * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "syncLiveMatches", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [match_sync_service_1.MatchSyncService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map