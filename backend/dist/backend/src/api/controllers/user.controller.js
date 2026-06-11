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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../../../../modules/users/users.service");
const user_usage_service_1 = require("../../../../modules/users/user-usage.service");
const current_user_decorator_1 = require("../../../../shared/decorators/current-user.decorator");
let UserController = class UserController {
    usersService;
    userUsageService;
    constructor(usersService, userUsageService) {
        this.usersService = usersService;
        this.userUsageService = userUsageService;
    }
    async getProfile(user) {
        if (!user?.id)
            return { error: 'Not authenticated' };
        const profile = await this.usersService.findBySupabaseUid(user.id);
        return { data: profile };
    }
    async getUsage(user) {
        if (!user?.id)
            return { error: 'Not authenticated' };
        const todayUsage = await this.userUsageService.getTodayUsage(user.id);
        const remaining = await this.usersService.getTodayRemainingUsage(user.id);
        return { data: { today_used: todayUsage, remaining: Math.max(0, remaining - todayUsage), limit: remaining } };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('usage'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUsage", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('api/user'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        user_usage_service_1.UserUsageService])
], UserController);
//# sourceMappingURL=user.controller.js.map