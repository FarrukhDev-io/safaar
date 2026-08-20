import { Injectable, Logger } from '@nestjs/common';
import { hmacSha256, partnerWebhookSigningSecret } from '../auth/security';
import { assertPublicHttpUrl } from '../common/ssrf-guard';
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

    let deliveryError: Error | undefined;
    try {
      const response = await this.fetchWithSsrfGuard(delivery.url, {
        method: 'POST',
        headers,
        body,
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
        deliveryError = new Error(
          `Webhook endpoint ${response.status} bilan javob berdi`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.markResult(deliveryId, 'failed', null, message);
      deliveryError = error instanceof Error ? error : new Error(message);
    }

    if (deliveryError) {
      // Qayta uloqtiramiz — aks holda BullMQ bu job'ni "completed" deb
      // hisoblaydi va attempts/backoff hech qachon ishga tushmaydi (C-4),
      // holbuki webhook yetkazishning butun maqsadi — vaqtincha
      // ishlamayotgan hamkor endpoint'iga avtomatik qayta urinishdir.
      throw deliveryError;
    }
  }

  /**
   * SSRF himoyasi: yetkazishdan darhol OLDIN URL'ni qayta tekshiradi
   * (webhook yaratilgandan beri DNS o'zgargan bo'lishi mumkin) va
   * redirect'larni avtomatik ergashtirmaydi — har bir `Location`
   * manzilini xuddi shu tekshiruvdan qayta o'tkazadi. Aks holda ochiq
   * ko'ringan URL ichki IP'ga (masalan cloud metadata) redirect qilib,
   * himoyani chetlab o'tishi mumkin edi.
   */
  private async fetchWithSsrfGuard(
    rawUrl: string,
    init: { method: string; headers: Record<string, string>; body: string },
    maxRedirects = 3,
  ): Promise<Response> {
    let currentUrl = (await assertPublicHttpUrl(rawUrl)).toString();

    for (let hop = 0; ; hop += 1) {
      const response = await fetch(currentUrl, {
        ...init,
        redirect: 'manual',
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });

      const isRedirect = response.status >= 300 && response.status < 400;
      const location = response.headers.get('location');
      if (!isRedirect || !location) {
        return response;
      }
      if (hop >= maxRedirects) {
        throw new Error('Webhook endpoint juda ko‘p marta redirect qildi');
      }

      currentUrl = (
        await assertPublicHttpUrl(new URL(location, currentUrl).toString())
      ).toString();
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
