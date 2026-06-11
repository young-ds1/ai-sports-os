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
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const analysis_entity_1 = require("./analysis.entity");
let AnalysisService = class AnalysisService {
    analysisRepo;
    constructor(analysisRepo) {
        this.analysisRepo = analysisRepo;
    }
    async getByMatch(matchId) {
        return this.analysisRepo.findOne({
            where: { match_id: matchId },
            order: { generated_at: 'DESC' },
        });
    }
    async create(data) {
        const analysis = this.analysisRepo.create(data);
        return this.analysisRepo.save(analysis);
    }
    async getByTeam(teamId) {
        return this.analysisRepo.find({
            where: { team_id: teamId },
            order: { generated_at: 'DESC' },
            take: 5,
        });
    }
    async invalidateCache(matchId) {
        await this.analysisRepo.update({ match_id: matchId }, { expires_at: new Date() });
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(analysis_entity_1.AiAnalysis)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], AnalysisService);
//# sourceMappingURL=analysis.service.js.map