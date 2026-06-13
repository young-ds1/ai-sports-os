import { Controller, Get, Param } from '@nestjs/common';
import { PredictionEngineService } from '../../../../modules/ai-engine/prediction/prediction-engine.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/predictions')
export class PredictionEngineController {
  constructor(private readonly engine: PredictionEngineService) {}

  @Get('match/:home/:away')
  @Public()
  predictMatch(@Param('home') home: string, @Param('away') away: string) {
    return this.engine.predictMatch(home, away);
  }

  @Get('all')
  @Public()
  predictAll() {
    return this.engine.predictAllMatches();
  }

  @Get('tournament')
  @Public()
  tournamentProjection() {
    return this.engine.getTournamentProjection();
  }

  @Get('track-record')
  @Public()
  trackRecord() {
    return this.engine.getTrackRecord();
  }
}
