import { Controller, Get, Post } from '@nestjs/common';
import { AutonomousLoopService } from './autonomous-loop.service';
import { Public } from '../../shared/decorators/public.decorator';

@Controller('api/autonomous')
export class AutonomousController {
  constructor(private readonly loop: AutonomousLoopService) {}

  /**
   * System status — is the autonomous company running?
   */
  @Get('status')
  @Public()
  async getStatus() {
    return { data: this.loop.getStatus() };
  }

  /**
   * Cycle history — what has the system been doing?
   */
  @Get('history')
  @Public()
  async getHistory() {
    return { data: this.loop.getHistory(20) };
  }

  /**
   * Manual trigger — force a cycle now (for testing/demo).
   */
  @Post('trigger')
  @Public()
  async triggerCycle() {
    const cycle = await this.loop.triggerCycle();
    return { data: cycle };
  }
}
