import { Controller, Get, Post, Body, HttpCode, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../../../shared/decorators/public.decorator';
import { MatchResultsService } from './match-results.service';

@Controller('api/results')
export class MatchResultsController {
  constructor(private readonly resultsService: MatchResultsService) {}

  @Get()
  @Public()
  async getResults(@Res() res: Response) {
    // Use raw Response to bypass TransformInterceptor wrapper
    // The frontend expects raw match-results.json format
    const data = this.resultsService.getResults();
    return res.json(data);
  }

  @Post('update')
  @Public()
  @HttpCode(200)
  async updateResults(@Body() body: any) {
    // Lightweight auth: require a simple secret to prevent abuse
    const secret = process.env.RESULTS_UPDATE_SECRET || 'wc2026-predict';
    const provided = body?.secret || '';
    if (secret && provided !== secret) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.resultsService.upsertResults(body);
      return { ok: true, count: result.count, message: result.message };
    } catch (err: any) {
      throw new HttpException(
        `Failed to update results: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
