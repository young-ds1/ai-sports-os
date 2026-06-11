import { Controller, Get } from '@nestjs/common';
import { VCDashboardService } from './vc-dashboard.service';
import { MoatMetricsService } from './moat-metrics.service';
import { Public } from '../../shared/decorators/public.decorator';

@Controller('api/vc')
export class VCIntelligenceController {
  constructor(
    private readonly vcDashboard: VCDashboardService,
    private readonly moatMetrics: MoatMetricsService,
  ) {}

  /**
   * The single endpoint an investor opens.
   * Complete company snapshot — traction, revenue, moat, flywheel, narrative.
   */
  @Get('snapshot')
  @Public()
  async getSnapshot() {
    return { data: await this.vcDashboard.getSnapshot() };
  }

  /**
   * Deep-dive: Moat strength analysis.
   */
  @Get('moat')
  @Public()
  async getMoatAssessment() {
    const snapshot = await this.vcDashboard.getSnapshot();
    return { data: snapshot.moat };
  }

  /**
   * Deep-dive: Unit economics.
   */
  @Get('economics')
  @Public()
  async getUnitEconomics() {
    const snapshot = await this.vcDashboard.getSnapshot();
    return { data: snapshot.unitEconomics };
  }

  /**
   * Deep-dive: Investment narrative (pitch-ready).
   */
  @Get('narrative')
  @Public()
  async getNarrative() {
    const snapshot = await this.vcDashboard.getSnapshot();
    return { data: snapshot.narrative };
  }

  /**
   * Traction summary — the numbers that matter.
   */
  @Get('traction')
  @Public()
  async getTraction() {
    const snapshot = await this.vcDashboard.getSnapshot();
    return {
      data: {
        traction: snapshot.traction,
        revenue: snapshot.revenue,
        flywheel: snapshot.flywheel,
      },
    };
  }
}
