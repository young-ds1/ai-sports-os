"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./user.entity");
const user_usage_entity_1 = require("./user-usage.entity");
const user_session_entity_1 = require("./user-session.entity");
const users_service_1 = require("./users.service");
const user_usage_service_1 = require("./user-usage.service");
const observability_service_1 = require("./observability/observability.service");
const ai_engine_module_1 = require("../ai-engine/ai-engine.module");
const USER_ENTITIES = [user_entity_1.User, user_usage_entity_1.UserUsage, user_session_entity_1.UserSession];
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature(USER_ENTITIES), ai_engine_module_1.AiEngineModule],
        providers: [users_service_1.UsersService, user_usage_service_1.UserUsageService, observability_service_1.ObservabilityService],
        exports: [typeorm_1.TypeOrmModule, users_service_1.UsersService, user_usage_service_1.UserUsageService, observability_service_1.ObservabilityService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map