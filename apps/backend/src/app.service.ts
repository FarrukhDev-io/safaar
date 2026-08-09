import { Injectable, Optional } from '@nestjs/common';
import { AppCacheService } from './infrastructure/cache.service';
import { PostgresService } from './infrastructure/postgres.service';

@Injectable()
export class AppService {
  constructor(
    @Optional() private readonly postgres?: PostgresService,
    @Optional() private readonly cache?: AppCacheService,
  ) {}

  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'safaar-api' };
  }

  getLive() {
    return {
      status: 'ok',
      service: 'safaar-api',
      check: 'live',
      timestamp: new Date().toISOString(),
    };
  }

  async getReady() {
    const database = await this.databaseStatus();
    const cache = this.cache
      ? await this.cache.healthStatus()
      : 'not_configured';
    const ready = database === 'ready' && cache !== 'unavailable';

    return {
      status: ready ? 'ok' : 'degraded',
      service: 'safaar-api',
      check: 'ready',
      dependencies: {
        database,
        cache,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async databaseStatus(): Promise<
    'ready' | 'not_configured' | 'unavailable'
  > {
    if (!this.postgres) {
      return 'not_configured';
    }

    try {
      await this.postgres.query('SELECT 1 AS ready');
      return 'ready';
    } catch {
      return 'unavailable';
    }
  }
}
