"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const domain_module_1 = require("../domain/domain.module");
const provider_router_service_1 = require("./router/provider-router.service");
const scheduler_service_1 = require("./scheduler/scheduler.service");
const match_sync_service_1 = require("./sync/match-sync.service");
let IngestionModule = class IngestionModule {
};
exports.IngestionModule = IngestionModule;
exports.IngestionModule = IngestionModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), domain_module_1.DomainModule],
        providers: [provider_router_service_1.ProviderRouterService, scheduler_service_1.SchedulerService, match_sync_service_1.MatchSyncService],
        exports: [provider_router_service_1.ProviderRouterService],
    })
], IngestionModule);
//# sourceMappingURL=ingestion.module.js.map