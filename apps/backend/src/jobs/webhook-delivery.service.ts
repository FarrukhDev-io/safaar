import { Injectable, Logger } from '@nestjs/common';
import { hmacSha256, partnerWebhookSigningSecret } from '../auth/security';
import { PostgresService } from '../infrastructure/postgres.service';

interface WebhookDeliveryRow {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: unknown;
  url: string;
  endpoint_status: string;
}

const DELIVERY_TIMEOUT_MS = 10_000;

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private readonly pg: PostgresService) {}

  async deliver(deliveryId: string): Promise<void> {
    const [delivery] = await this.pg.query<WebhookDeliveryRow>(
      `SELECT d.id::text, d.endpoint_id::text, d.event_type, d.payload,
              e.url, e.status AS endpoint_status
       FROM partner_webhook_deliveries d
       JOIN partner_webhook_endpoints e ON e.id = d.endpoint_id
       WHERE d.id = $1::uuid`,
      [deliveryId],
    );

    if (!delivery) {
      this.logger.warn(`Webhook delivery topilmadi: ${deliveryId}`);
      return;
    }

    if (delivery.endpoint_status !== 'active') {
      await this.markResult(deliveryId, 'skipped', null, 'endpoint faol emas');
      return;
    }

    const body = JSON.stringify({
      event: delivery.event_type,
      delivery_id: delivery.id,
      payload: delivery.payload,
    });

    // Hozircha `partner_webhook_endpoints.secret_hash` hech qanday yaratish
    // oqimida to'ldirilmaydi (webhook yaratishda secret generatsiya
    // qilinmaydi) — shuning uchun imzo faqat global
    // PARTNER_WEBHOOK_SIGNING_SECRET mavjud bo'lsa qo'shiladi, aks holda
    // imzosiz yuboriladi. Bu — kelajakda per-endpoint secret provisioning
    // qo'shilganda kengaytiriladigan joy.
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Safaar-Event': delivery.event_type,
      'X-Safaar-Delivery-Id': delivery.id,
    };
    const globalSecret = partnerWebhookSigningSecret();
    if (globalSecret) {
      headers['X-Safaar-Signature'] = hmacSha256(body, globalSecret);
    }

    try {
      const response = await fetch(delivery.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      const responseBody = await response.text().catch(() => '');
      const truncatedBody = responseBody.slice(0, 4000);

      if (response.ok) {
        await this.markResult(
          deliveryId,
          'delivered',
          response.status,
          truncatedBody,
        );
      } else {
        await this.markResult(
          deliveryId,
          'failed',
          response.status,
          truncatedBody,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.markResult(deliveryId, 'failed', null, message);
    }
  }

  private async markResult(
    deliveryId: string,
    status: 'delivered' | 'failed' | 'skipped',
    responseStatus: number | null,
    responseBody: string | null,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.pg.query(
      `UPDATE partner_webhook_deliveries
       SET status = $1, response_status = $2, response_body = $3,
           attempted_at = $4, updated_at = $4
       WHERE id = $5::uuid`,
      [status, responseStatus, responseBody, now, deliveryId],
    );
  }
}
