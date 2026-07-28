import { Module } from '@nestjs/common';
import {
  AnalyticsAdminController,
  AnalyticsController,
} from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController, AnalyticsAdminController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
