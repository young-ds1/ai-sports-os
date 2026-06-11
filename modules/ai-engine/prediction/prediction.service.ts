import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiPrediction } from './prediction.entity';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    @InjectRepository(AiPrediction)
    private readonly predictionRepo: Repository<AiPrediction>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getByMatch(matchId: string): Promise<AiPrediction | null> {
    return this.predictionRepo.findOne({
      where: { match_id: matchId },
      order: { generated_at: 'DESC' },
    });
  }

  async create(data: Partial<AiPrediction>): Promise<AiPrediction> {
    const prediction = this.predictionRepo.create(data);
    const saved = await this.predictionRepo.save(prediction);

    // Emit event for feedback loop
    this.eventEmitter.emit('prediction.generated', {
      predictionId: saved.id,
      matchId: saved.match_id,
      model: saved.model_version,
      confidence: saved.confidence_score,
    });

    this.logger.log(
      `[Prediction] Generated for match=${saved.match_id} model=${saved.model_version} confidence=${saved.confidence_score}`,
    );

    return saved;
  }

  async verifyResult(matchId: string, actualResult: string): Promise<{
    total: number;
    correct: number;
    accuracy: number;
  }> {
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
      if (maxProb === homeWin) predictedResult = 'home_win';
      else if (maxProb === draw) predictedResult = 'draw';
      else predictedResult = 'away_win';

      const isCorrect = predictedResult === actualResult;
      if (isCorrect) correctCount++;

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

    this.logger.log(
      `[Prediction] Verified match=${matchId}: ${correctCount}/${predictions.length} correct (${accuracy}%)`,
    );

    return { total: predictions.length, correct: correctCount, accuracy };
  }

  /**
   * Get prediction accuracy stats for the feedback loop.
   */
  async getAccuracyStats(): Promise<{
    totalVerified: number;
    totalCorrect: number;
    overallAccuracy: number;
    byModel: Record<string, { verified: number; correct: number; accuracy: number }>;
  }> {
    const verified = await this.predictionRepo.find({
      where: { is_verified: true },
    });

    const totalCorrect = verified.filter(p => p.is_correct).length;
    const overallAccuracy = verified.length > 0
      ? Math.round((totalCorrect / verified.length) * 100)
      : 0;

    const byModel: Record<string, { verified: number; correct: number; accuracy: number }> = {};
    for (const p of verified) {
      const model = p.model_version || 'unknown';
      if (!byModel[model]) byModel[model] = { verified: 0, correct: 0, accuracy: 0 };
      byModel[model].verified++;
      if (p.is_correct) byModel[model].correct++;
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
  async getUnverified(): Promise<AiPrediction[]> {
    return this.predictionRepo.find({
      where: { is_verified: false },
      order: { generated_at: 'ASC' },
      take: 100,
    });
  }
}
