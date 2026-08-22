import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Payme (Paycom) checkout URL integratsiyasi — https://developer.help.paycom.uz
 *
 * Chiquvchi tomon: `m` (merchant id), `ac.<parametr>` (bizning
 * booking_id'ni bog'lash uchun account field — Payme kabinetida
 * "booking_id" nomli account field sozlanishi kerak), `a` (summasi
 * TIYIN'da, ya'ni so'm * 100) — base64'ga o'ralib checkout.paycom.uz
 * manziliga qo'shiladi.
 *
 * MUHIM: Payme'ning kiruvchi (inbound) webhook protokoli REST emas —
 * JSON-RPC 2.0 (`CheckPerformTransaction`, `CreateTransaction`,
 * `PerformTransaction`, `CancelTransaction`, `CheckTransaction`,
 * `GetStatement` metodlari, HTTP Basic Auth `Paycom:{key}` bilan) va
 * hozirgi umumiy `providerWebhook()` marshruti bu formatga mos emas.
 * Shu sabab bu fayl faqat CHIQUVCHI checkout URL'ni ta'minlaydi — kiruvchi
 * JSON-RPC handler alohida, kelajakda qo'shiladigan ish sifatida qoladi
 * (PaymentsController'dagi `webhooks/payme` route hozircha eski umumiy
 * yo'l bilan ishlaydi va Payme bilan hali real ishlamaydi).
 */
@Injectable()
export class PaymeProvider {
  private readonly merchantId?: string;

  constructor(config: ConfigService) {
    this.merchantId = config.get<string>('PAYME_MERCHANT_ID');
  }

  isConfigured(): boolean {
    return Boolean(this.merchantId);
  }

  buildCheckoutUrl(params: {
    bookingId: string;
    amount: number;
    returnUrl: string;
  }): string {
    if (!this.merchantId) {
      throw new Error('PAYME_NOT_CONFIGURED');
    }
    const amountTiyin = Math.round(params.amount * 100);
    const raw = `m=${this.merchantId};ac.booking_id=${params.bookingId};a=${amountTiyin};c=${params.returnUrl}`;
    const encoded = Buffer.from(raw, 'utf8').toString('base64');
    return `https://checkout.paycom.uz/${encoded}`;
  }
}
