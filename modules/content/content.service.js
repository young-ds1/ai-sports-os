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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const content_task_entity_1 = require("./entities/content-task.entity");
const content_output_entity_1 = require("./entities/content-output.entity");
let ContentService = class ContentService {
    taskRepo;
    outputRepo;
    constructor(taskRepo, outputRepo) {
        this.taskRepo = taskRepo;
        this.outputRepo = outputRepo;
    }
    async getTasks(status, limit = 20) {
        const where = {};
        if (status)
            where.status = status;
        return this.taskRepo.find({ where, order: { created_at: 'DESC' }, take: limit });
    }
    async getOutputs(taskId) {
        return this.outputRepo.find({
            where: { task_id: taskId },
            order: { generated_at: 'DESC' },
        });
    }
    async getLatestOutputs(platform, limit = 20) {
        const where = {};
        if (platform)
            where.platform = platform;
        return this.outputRepo.find({
            where,
            order: { generated_at: 'DESC' },
            take: limit,
        });
    }
    async retryTask(taskId) {
        await this.taskRepo.update(taskId, { status: content_task_entity_1.ContentStatus.PENDING });
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(content_task_entity_1.ContentTask)),
    __param(1, (0, typeorm_1.InjectRepository)(content_output_entity_1.ContentOutput)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object])
], ContentService);
//# sourceMappingURL=content.service.js.map