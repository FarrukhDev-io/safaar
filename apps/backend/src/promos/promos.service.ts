import { Injectable } from '@nestjs/common';
import { PostgresService } from '../infrastructure/postgres.service';

interface PromoRow {
  id: string;
  code: string;
  discount_type: string | null;
  discount_value: number;
  usage_limit: number;
  used_count: number;
  valid_until: string;
}

@Injectable()
export class PromosService {
  constructor(private readonly pg: PostgresService) {}

  private async rows(sql: string, params: readonly unknown[] = []) {
    return this.pg.query<PromoRow>(sql, params);
  }

  private promoSelect(extraWhere: string): string {
    return `
      select
        id::text,
        coalesce(title ->> 'uz', upper(slug), 'PROMO') as code,
        metadata ->> 'discountType' as discount_type,
        coalesce((metadata ->> 'discountValue')::float8, 0) as discount_value,
        coalesce((metadata ->> 'usageLimit')::int, 0) as usage_limit,
        coalesce((metadata ->> 'usedCount')::int, 0) as used_count,
        coalesce(published_at, created_at + interval '30 days') as valid_until
      from cms_entries
      where type = 'promo' and status = 'published' ${extraWhere}
    `;
  }

  /** `POST /promos/validate` — checkout'da promo-kodni tekshiradi. */
  async validate(body: Record<string, unknown>) {
    const code = String(body.code ?? '')
      .trim()
      .toUpperCase();
    if (!code) {
      return { code, valid: false, discount_type: null, discount_value: 0 };
    }

    const [promo] = await this.rows(
      `${this.promoSelect('and slug = $1')} limit 1`,
      [code.toLowerCase().replace(/\s+/g, '-')],
    );

    const valid = Boolean(
      promo &&
      new Date(promo.valid_until).getTime() > Date.now() &&
      promo.used_count < promo.usage_limit,
    );

    return {
      code,
      valid,
      discount_type: valid ? promo.discount_type : null,
      discount_value: valid ? Number(promo.discount_value) : 0,
    };
  }

  /** `GET /promos` — hozir amal qiladigan promo-kodlar ro'yxati (ommaviy). */
  async active() {
    const rows = await this.rows(
      `${this.promoSelect(
        "and coalesce(published_at, created_at + interval '30 days') > now()",
      )} order by created_at desc limit 20`,
    );

    return rows
      .filter((row) => row.used_count < row.usage_limit)
      .map((row) => ({
        code: row.code,
        discount_type: row.discount_type,
        discount_value: Number(row.discount_value),
        valid_until: row.valid_until,
      }));
  }
}
