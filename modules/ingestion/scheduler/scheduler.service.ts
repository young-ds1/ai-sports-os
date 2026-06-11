import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MatchSyncService } from '../sync/match-sync.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly matchSync: MatchSyncService) {}

  // Sync fixtures every 5 minutes
  @Cron('*/5 * * * *')
  async syncFixtures(): Promise<void> {
    this.logger.log('Syncing fixtures...');
    try {
      const today = new Date().toISOString().split('T')[0];
      await this.matchSync.syncFixtures('api-football', today);
      this.logger.log('Fixtures synced successfully');
    } catch (err) {
      this.logger.error('Failed to sync fixtures', err);
    }
  }

  // Sync live matches every minute
  @Cron('* * * * *')
  async syncLiveMatches(): Promise<void> {
    try {
      await this.matchSync.syncLiveMatches('api-football');
    } catch (err) {
      this.logger.error('Failed to sync live matches', err);
    }
  }
}
