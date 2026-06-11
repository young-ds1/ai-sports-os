import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { PredictionService } from '../../../../modules/ai-engine/prediction/prediction.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/ai/predictions')
export class AiPredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get(':matchId')
  @Public()
  async getPrediction(@Param('matchId') matchId: string) {
    const prediction = await this.predictionService.getByMatch(matchId);
    if (!prediction) return { data: null, message: 'No prediction available yet' };
    return { data: prediction.prediction, confidence: prediction.confidence_score };
  }

  // ── Prediction Feedback Loop ──

  @Post(':matchId/verify')
  @Public()
  async verifyPrediction(@Param('matchId') matchId: string, @Body() body: { actualResult: string }) {
    const result = await this.predictionService.verifyResult(matchId, body.actualResult);
    return { data: result };
  }

  @Get('stats/accuracy')
  @Public()
  async getAccuracyStats() {
    return { data: await this.predictionService.getAccuracyStats() };
  }

  @Get('stats/unverified')
  @Public()
  async getUnverified() {
    return { data: await this.predictionService.getUnverified() };
  }
}
