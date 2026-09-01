import { ForbiddenException, Injectable } from '@nestjs/common';
import { BookingStatus } from '@safaar/types';
import { PostgresService } from '../infrastructure/postgres.service';
import {
  hashSecret,
  hmacSha256,
  partnerApiPepper,
  timingSafeEqualString,
} from '../auth/security';

@Injectable()
export class PartnerApiService {
  constructor(private readonly pg: PostgresService) {}

  async bookings(apiKey: string | undefined) {
    const organizationId = await this.organizationId(apiKey);
    return this.pg.query(
      `SELECT * FROM bookings WHERE partner_organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
  }

  async booking(apiKey: string | undefined, id: string) {
    const organizationId = await this.organizationId(apiKey);
    const bookings = await this.pg.query(
      `SELECT * FROM bookings WHERE id = $1 AND partner_organization_id = $2`,
      [id, organizationId],
    );
    if (!bookings[0]) {
      throw new ForbiddenException({
        code: 'BOOKING_FORBIDDEN',
        message: 'Bu bron API key tashkilotiga tegishli emas',
      });
    }
    return bookings[0];
  }

  async bookingStatus(
    apiKey: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const organizationId = await this.organizationId(apiKey);
    const now = new Date().toISOString();

    const bookings = await this.pg.query(
      `SELECT * FROM bookings WHERE id = $1 AND partner_organization_id = $2`,
      [id, organizationId],
    );

    if (!bookings[0]) {
      throw new ForbiddenException({
        code: 'BOOKING_FORBIDDEN',
        message: 'Bu bron API key tashkilotiga tegishli emas',
      });
    }

    if (body.status === 'completed') {
      // Defense-in-depth: yuqorida SELECT allaqachon egalikni tasdiqlagan
      // bo'lsa-da, UPDATE'ning o'z WHERE shartiga ham
      // `partner_organization_id`ni qo'shamiz — shu qatordagina emas,
      // har doim, har bir yozuv amalida mustaqil ravishda tekshiriladi.
      await this.pg.query(
        `UPDATE bookings SET status = $1, updated_at = $2
         WHERE id = $3 AND partner_organization_id = $4`,
        [BookingStatus.COMPLETED, now, id, organizationId],
      );
    }

    const updated = await this.pg.query(
      `SELECT * FROM bookings WHERE id = $1 AND partner_organization_id = $2`,
      [id, organizationId],
    );
    return updated[0];
  }

  async hotels(apiKey: string | undefined) {
    const organizationId = await this.organizationId(apiKey);
    return this.pg.query(
      `SELECT * FROM hotels WHERE partner_organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
  }

  async trips(apiKey: string | undefined) {
    const organizationId = await this.organizationId(apiKey);
    return this.pg.query(
      `SELECT t.* FROM trips t
       JOIN bus_companies bc ON bc.id = t.company_id
       WHERE bc.partner_organization_id = $1
       ORDER BY t.departure_at DESC`,
      [organizationId],
    );
  }

  async webhookTest(apiKey: string | undefined, body: Record<string, unknown>) {
    await this.organizationId(apiKey); // validate key
    const event = String(body.event ?? 'booking.created');
    const deliveredAt = new Date().toISOString();
    const payload = JSON.stringify({
      event,
      body,
      delivered_at: deliveredAt,
    });
    return {
      event,
      signature: hmacSha256(payload, partnerApiPepper()),
      delivered: true,
      delivered_at: deliveredAt,
    };
  }

  private async organizationId(apiKey: string | undefined): Promise<string> {
    if (!apiKey) {
      throw new ForbiddenException({
        code: 'API_KEY_INVALID',
        message: 'Partner API key yaroqsiz',
      });
    }

    const activeKeys = await this.pg.query(
      `SELECT * FROM partner_api_keys WHERE status = 'active'`,
    );

    let matchedKey: Record<string, unknown> | undefined;
    for (const key of activeKeys) {
      const prefix = String(key['key_prefix'] ?? '');
      const secretHash = String(key['secret_hash'] ?? '');
      if (
        prefix &&
        apiKey.startsWith(`${prefix}_`) &&
        timingSafeEqualString(secretHash, this.hashApiKey(apiKey))
      ) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      throw new ForbiddenException({
        code: 'API_KEY_INVALID',
        message: 'Partner API key yaroqsiz',
      });
    }

    return String(matchedKey['organization_id']);
  }

  private hashApiKey(apiKey: string): string {
    return hashSecret(apiKey, partnerApiPepper());
  }
}
