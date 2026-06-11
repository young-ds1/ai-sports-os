import { Controller, Get, Param } from '@nestjs/common';
import { CompetitionsService } from '../../../../modules/domain/competitions/competitions.service';
import { Public } from '../../../../shared/decorators/public.decorator';

@Controller('api/competitions')
export class CompetitionController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  @Public()
  async findAll() {
    return this.competitionsService.findBySport('football');
  }

  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    return this.competitionsService.findById(id);
  }
}
