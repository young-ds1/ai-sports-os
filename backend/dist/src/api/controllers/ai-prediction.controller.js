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
exports.AiPredictionController = void 0;
const common_1 = require("@nestjs/common");
const prediction_service_1 = require("../../../../modules/ai-engine/prediction/prediction.service");
const public_decorator_1 = require("../../../../shared/decorators/public.decorator");
let AiPredictionController = class AiPredictionController {
    predictionService;
    constructor(predictionService) {
        this.predictionService = predictionService;
    }
    async getPrediction(matchId) {
        const prediction = await this.predictionService.getByMatch(matchId);
        if (!prediction)
            return { data: null, message: 'No prediction available yet' };
        return { data: prediction.prediction, confidence: prediction.confidence_score };
    }
    // ── Prediction Feedback Loop ──
    async verifyPrediction(matchId, body) {
        const result = await this.predictionService.verifyResult(matchId, body.actualResult);
        return { data: result };
    }
    async getAccuracyStats() {
        return { data: await this.predictionService.getAccuracyStats() };
    }
    async getUnverified() {
        return { data: await this.predictionService.getUnverified() };
    }
};
exports.AiPredictionController = AiPredictionController;
__decorate([
    (0, common_1.Get)(':matchId'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiPredictionController.prototype, "getPrediction", null);
__decorate([
    (0, common_1.Post)(':matchId/verify'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiPredictionController.prototype, "verifyPrediction", null);
__decorate([
    (0, common_1.Get)('stats/accuracy'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiPredictionController.prototype, "getAccuracyStats", null);
__decorate([
    (0, common_1.Get)('stats/unverified'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiPredictionController.prototype, "getUnverified", null);
exports.AiPredictionController = AiPredictionController = __decorate([
    (0, common_1.Controller)('api/ai/predictions'),
    __metadata("design:paramtypes", [prediction_service_1.PredictionService])
], AiPredictionController);
//# sourceMappingURL=ai-prediction.controller.js.map