import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@safaar/types';
import { buildActorFromHeaders } from '../common/actor';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AnalyticsService } from './analytics.service';

interface AnalyticsRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  event(
    @Req() request: AnalyticsRequest,
    @Body() body: Record<string, unknown>,
  ) {
    const actor = buildActorFromHeaders(request.headers);
    return this.analyticsService.ingest(actor, body, {
      userAgent: firstHeader(request.headers['user-agent']),
      ip:
        firstHeader(request.headers['x-forwarded-for']) ??
        request.ip ??
        request.socket?.remoteAddress,
      sessionId: firstHeader(request.headers['x-session-id']),
    });
  }
}

@Controller('admin/analytics')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AnalyticsAdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@Query() query: Record<string, string | undefined>) {
    return this.analyticsService.dashboard(query);
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
