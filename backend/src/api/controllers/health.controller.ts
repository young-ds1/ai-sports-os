import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() };
  }
}
