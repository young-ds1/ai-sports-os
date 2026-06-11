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
exports.CompetitionController = void 0;
const common_1 = require("@nestjs/common");
const competitions_service_1 = require("../../../../modules/domain/competitions/competitions.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let CompetitionController = class CompetitionController {
    competitionsService;
    constructor(competitionsService) {
        this.competitionsService = competitionsService;
    }
    async findAll() {
        return this.competitionsService.findBySport('football');
    }
    async findById(id) {
        return this.competitionsService.findById(id);
    }
};
exports.CompetitionController = CompetitionController;
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findById", null);
exports.CompetitionController = CompetitionController = __decorate([
    (0, common_1.Controller)('api/competitions'),
    __metadata("design:paramtypes", [competitions_service_1.CompetitionsService])
], CompetitionController);
//# sourceMappingURL=competition.controller.js.map