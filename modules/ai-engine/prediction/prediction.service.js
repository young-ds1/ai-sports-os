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
var PredictionService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const prediction_entity_1 = require("./prediction.entity");
let PredictionService = PredictionService_1 = class PredictionService {
    predictionRepo;
    eventEmitter;
    logger = new common_1.Logger(PredictionService_1.name);
    constructor(predictionRepo, eventEmitter) {
        this.predictionRepo = predictionRepo;
        this.eventEmitter = eventEmitter;
    }
    async getByMatch(matchId) {
        return this.predictionRepo.findOne({
            where: { match_id: matchId },
            order: { generated_at: 'DESC' },
        });
    }
    async create(data) {
        const prediction = this.predictionRepo.create(data);
        const saved = await this.predictionRepo.save(prediction);
        // Emit event for feedback loop
        this.eventEmitter.emit('prediction.generated', {
            predictionId: saved.id,
            matchId: saved.match_id,
            model: saved.model_version,
            confidence: saved.confidence_score,
        });
        this.logger.log(`[Prediction] Generated for match=${saved.match_id} model=${saved.model_version} confidence=${saved.confidence_score}`);
        return saved;
    }
    async verifyResult(matchId, actualResult) {
        const predictions = await this.predictionRepo.find({
            where: { match_id: matchId, is_verified: false },
        });
        let correctCount = 0;
        for (const pred of predictions) {
            const homeWin = pred.prediction?.['win_probability'] || pred.prediction?.['home_win_probability'];
            const draw = pred.prediction?.['draw_probability'];
            const awayWin = pred.prediction?.['loss_probability'] || pred.prediction?.['away_win_probability'];
            const maxProb = Math.max(homeWin || 0, draw || 0, awayWin || 0);
            let predictedResult = '';
            if (maxProb === homeWin)
                predictedResult = 'home_win';
            else if (maxProb === draw)
                predictedResult = 'draw';
            else
                predictedResult = 'away_win';
            const isCorrect = predictedResult === actualResult;
            if (isCorrect)
                correctCount++;
            await this.predictionRepo.update(pred.id, {
                is_verified: true,
                is_correct: isCorrect,
                actual_result: actualResult,
            });
        }
        const accuracy = predictions.length > 0
            ? Math.round((correctCount / predictions.length) * 100)
            : 0;
        // Emit verification event for feedback loop
        this.eventEmitter.emit('prediction.verified', {
            matchId,
            actualResult,
            total: predictions.length,
            correct: correctCount,
            accuracy,
        });
        this.logger.log(`[Prediction] Verified match=${matchId}: ${correctCount}/${predictions.length} correct (${accuracy}%)`);
        return { total: predictions.length, correct: correctCount, accuracy };
    }
    /**
     * Get prediction accuracy stats for the feedback loop.
     */
    async getAccuracyStats() {
        const verified = await this.predictionRepo.find({
            where: { is_verified: true },
        });
        const totalCorrect = verified.filter(p => p.is_correct).length;
        const overallAccuracy = verified.length > 0
            ? Math.round((totalCorrect / verified.length) * 100)
            : 0;
        const byModel = {};
        for (const p of verified) {
            const model = p.model_version || 'unknown';
            if (!byModel[model])
                byModel[model] = { verified: 0, correct: 0, accuracy: 0 };
            byModel[model].verified++;
            if (p.is_correct)
                byModel[model].correct++;
        }
        for (const key of Object.keys(byModel)) {
            const m = byModel[key];
            m.accuracy = m.verified > 0 ? Math.round((m.correct / m.verified) * 100) : 0;
        }
        return {
            totalVerified: verified.length,
            totalCorrect,
            overallAccuracy,
            byModel,
        };
    }
    /**
     * Get all unverified predictions that need feedback.
     */
    async getUnverified() {
        return this.predictionRepo.find({
            where: { is_verified: false },
            order: { generated_at: 'ASC' },
            take: 100,
        });
    }
};
exports.PredictionService = PredictionService;
exports.PredictionService = PredictionService = PredictionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(prediction_entity_1.AiPrediction)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _b : Object])
], PredictionService);
//# sourceMappingURL=prediction.service.js.map