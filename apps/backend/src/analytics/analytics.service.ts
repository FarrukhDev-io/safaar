import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';

const funnelEvents = [
  'search_performed',
  'hotel_viewed',
  'booking_started',
  'booking_completed',
] as const;

interface AnalyticsContext {
  userAgent?: string;
  ip?: string;
  sessionId?: string;
}

interface FunnelRow {
  event_name: string;
  events_count: string | number;
  sessions_count: string | number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly pg: PostgresService) {}

  async ingest(
    actor: RequestActor | undefined,
    body: Record<string, unknown>,
    context: AnalyticsContext,
  ) {
    const eventName = String(body.eventName ?? body.event_name ?? '').trim();
    if (!eventName || eventName.length > 120) {
      throw new BadRequestException({
        code: 'ANALYTICS_EVENT_NAME_INVALID',
        message: 'eventName majburiy va 120 belgidan oshmasligi kerak',
      });
    }

    const id = randomUUID();
    const occurredAt = parseTimestamp(body.timestamp) ?? new Date();
    const receivedAt = new Date().toISOString();
    const params = objectValue(body.params);
    const sessionId =
      stringValue(body.sessionId ?? body.session_id) ??
      actor?.sessionId ??
      context.sessionId;

    await this.pg.query(
      `INSERT INTO analytics_events
         (id, user_id, session_id, event_name, params, occurred_at,
          received_at, user_agent, ip)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)`,
      [
        id,
        actor?.actorType === 'user' ? actor.id : null,
        sessionId ?? null,
        eventName,
        JSON.stringify(params),
        occurredAt.toISOString(),
        receivedAt,
        context.userAgent ?? null,
        firstIp(context.ip),
      ],
    );

    return {
      id,
      accepted: true,
      eventName,
      userId: actor?.actorType === 'user' ? actor.id : null,
      sessionId: sessionId ?? null,
      timestamp: occurredAt.toISOString(),
    };
  }

  async dashboard(query: Record<string, string | undefined>) {
    const days = boundedDays(Number(query.days ?? 30));
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const [funnelRows, destinations, paymentMethods] = await Promise.all([
      this.funnelRows(since),
      this.popularDestinations(since),
      this.paymentMethodShares(since),
    ]);

    return {
      window: {
        days,
        since,
        until: new Date().toISOString(),
      },
      conversionFunnel: this.funnel(funnelRows),
      popularDestinations: destinations,
      paymentMethodShares: paymentMethods,
    };
  }

  private async funnelRows(since: string) {
    return this.pg.query<FunnelRow>(
      `SELECT event_name,
          COUNT(*)::int AS events_count,
          COUNT(DISTINCT COALESCE(session_id, user_id::text, id::text))::int
            AS sessions_count
       FROM analytics_events
       WHERE event_name = ANY($1::text[])
         AND occurred_at >= $2
       GROUP BY event_name`,
      [[...funnelEvents], since],
    );
  }

  private async popularDestinations(since: string) {
    return this.pg.query(
      `SELECT destination, COUNT(*)::int AS searches
       FROM (
         SELECT COALESCE(
           params ->> 'destination',
           params ->> 'city',
           params ->> 'cityName',
           params ->> 'location'
         ) AS destination
         FROM analytics_events
         WHERE event_name = 'search_performed'
           AND occurred_at >= $1
       ) source
       WHERE destination IS NOT NULL AND destination <> ''
       GROUP BY destination
       ORDER BY searches DESC, destination ASC
       LIMIT 10`,
      [since],
    );
  }

  private async paymentMethodShares(since: string) {
    return this.pg.query(
      `SELECT payment_method::text AS payment_method,
          COUNT(*)::int AS bookings,
          COALESCE(SUM(total_amount), 0)::float8 AS total_sum
       FROM bookings
       WHERE created_at >= $1
       GROUP BY payment_method
       ORDER BY bookings DESC, payment_method ASC`,
      [since],
    );
  }

  private funnel(rows: FunnelRow[]) {
    const byName = new Map(rows.map((row) => [row.event_name, row]));
    let previousSessions: number | null = null;

    return funnelEvents.map((eventName) => {
      const row = byName.get(eventName);
      const sessions = Number(row?.sessions_count ?? 0);
      const events = Number(row?.events_count ?? 0);
      const step = {
        eventName,
        events,
        sessions,
        conversionFromPrevious:
          previousSessions && previousSessions > 0
            ? Number((sessions / previousSessions).toFixed(4))
            : null,
      };
      previousSessions = sessions;
      return step;
    });
  }
}

function parseTimestamp(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function firstIp(value: string | undefined): string | null {
  return value?.split(',')[0]?.trim().slice(0, 80) || null;
}

function boundedDays(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 30;
  return Math.min(Math.max(Math.round(value), 1), 365);
}
