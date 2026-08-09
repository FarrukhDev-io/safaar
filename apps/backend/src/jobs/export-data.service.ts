import { Injectable } from '@nestjs/common';
import { PostgresService } from '../infrastructure/postgres.service';
import type { ExportData } from './export-generators';

const REPORT_ROW_LIMIT = 10_000;

@Injectable()
export class ExportDataService {
  constructor(private readonly pg: PostgresService) {}

  async resolve(
    ownerType: string,
    ownerId: string,
    type: string,
  ): Promise<ExportData> {
    switch (type) {
      case 'personal-data':
        return this.personalData(ownerId);
      case 'admin-users':
        return this.adminUsers();
      case 'admin-partners':
        return this.adminPartners();
      case 'admin-finance':
        return this.adminFinance();
      case 'tax-report':
        return this.taxReport();
      case 'partner-bookings':
        return this.partnerBookings(ownerId);
      case 'partner-finance':
        return this.partnerFinance(ownerId);
      default:
        throw new Error(`Noma'lum export turi: ${type}`);
    }
  }

  private async personalData(userId: string): Promise<ExportData> {
    const [user] = await this.pg.query(
      `SELECT id::text, first_name, last_name, email, phone, status,
              preferred_language, bonus_balance::float8, created_at
       FROM users WHERE id = $1::uuid`,
      [userId],
    );
    const bookings = await this.pg.query(
      `SELECT id::text, booking_number, type, status, currency,
              total_amount::float8, hotel_id::text, trip_id::text,
              check_in, check_out, created_at
       FROM bookings WHERE user_id = $1::uuid
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, REPORT_ROW_LIMIT],
    );

    return {
      kind: 'json',
      title: 'Shaxsiy maʻlumotlar',
      data: { user: user ?? null, bookings },
    };
  }

  private async adminUsers(): Promise<ExportData> {
    const rows = await this.pg.query(
      `SELECT id::text, first_name, last_name, email, phone, status, created_at
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1`,
      [REPORT_ROW_LIMIT],
    );

    return {
      kind: 'tabular',
      title: 'Foydalanuvchilar',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'first_name', header: 'Ism' },
        { key: 'last_name', header: 'Familiya' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Telefon' },
        { key: 'status', header: 'Holat' },
        { key: 'created_at', header: "Ro'yxatdan o'tgan sana" },
      ],
      rows,
    };
  }

  private async adminPartners(): Promise<ExportData> {
    const rows = await this.pg.query(
      `SELECT id::text, type, legal_name, brand_name, tax_id, phone, email,
              status, default_commission_rate::float8, created_at
       FROM partner_organizations
       ORDER BY created_at DESC
       LIMIT $1`,
      [REPORT_ROW_LIMIT],
    );

    return {
      kind: 'tabular',
      title: 'Hamkorlar',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'type', header: 'Turi' },
        { key: 'legal_name', header: 'Yuridik nomi' },
        { key: 'brand_name', header: 'Brend nomi' },
        { key: 'tax_id', header: 'STIR' },
        { key: 'phone', header: 'Telefon' },
        { key: 'email', header: 'Email' },
        { key: 'status', header: 'Holat' },
        { key: 'default_commission_rate', header: 'Komissiya %' },
        { key: 'created_at', header: "Qo'shilgan sana" },
      ],
      rows,
    };
  }

  private async adminFinance(): Promise<ExportData> {
    const rows = await this.pg.query(
      `SELECT b.booking_number, po.brand_name AS partner_name, b.type,
              b.status, b.currency, b.total_amount::float8,
              b.commission_amount::float8, b.partner_payable::float8,
              b.created_at
       FROM bookings b
       JOIN partner_organizations po ON po.id = b.partner_organization_id
       ORDER BY b.created_at DESC
       LIMIT $1`,
      [REPORT_ROW_LIMIT],
    );

    return {
      kind: 'tabular',
      title: 'Moliyaviy hisobot',
      columns: [
        { key: 'booking_number', header: 'Bron raqami' },
        { key: 'partner_name', header: 'Hamkor' },
        { key: 'type', header: 'Turi' },
        { key: 'status', header: 'Holat' },
        { key: 'currency', header: 'Valyuta' },
        { key: 'total_amount', header: 'Umumiy summa' },
        { key: 'commission_amount', header: 'Komissiya' },
        { key: 'partner_payable', header: "Hamkorga to'lanadigan" },
        { key: 'created_at', header: 'Sana' },
      ],
      rows,
    };
  }

  private async taxReport(): Promise<ExportData> {
    const rows = await this.pg.query(
      `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
              currency,
              count(*)::int AS bookings_count,
              sum(total_amount)::float8 AS gross_total,
              sum(commission_amount)::float8 AS commission_total,
              sum(partner_payable)::float8 AS partner_payable_total
       FROM bookings
       WHERE status NOT IN ('cancelled', 'expired')
       GROUP BY date_trunc('month', created_at), currency
       ORDER BY date_trunc('month', created_at) DESC
       LIMIT 240`,
    );

    return {
      kind: 'tabular',
      title: 'Soliq hisoboti (oylik)',
      columns: [
        { key: 'month', header: 'Oy' },
        { key: 'currency', header: 'Valyuta' },
        { key: 'bookings_count', header: 'Bronlar soni' },
        { key: 'gross_total', header: 'Yalpi summa' },
        { key: 'commission_total', header: 'Komissiya (platforma daromadi)' },
        { key: 'partner_payable_total', header: "Hamkorlarga to'langan" },
      ],
      rows,
    };
  }

  private async partnerBookings(organizationId: string): Promise<ExportData> {
    const rows = await this.pg.query(
      `SELECT booking_number, type, status, currency, total_amount::float8,
              guest_name, check_in, check_out, created_at
       FROM bookings
       WHERE partner_organization_id = $1::uuid
       ORDER BY created_at DESC
       LIMIT $2`,
      [organizationId, REPORT_ROW_LIMIT],
    );

    return {
      kind: 'tabular',
      title: 'Bronlar',
      columns: [
        { key: 'booking_number', header: 'Bron raqami' },
        { key: 'type', header: 'Turi' },
        { key: 'status', header: 'Holat' },
        { key: 'currency', header: 'Valyuta' },
        { key: 'total_amount', header: 'Summa' },
        { key: 'guest_name', header: 'Mehmon' },
        { key: 'check_in', header: 'Kirish sanasi' },
        { key: 'check_out', header: 'Chiqish sanasi' },
        { key: 'created_at', header: 'Yaratilgan sana' },
      ],
      rows,
    };
  }

  private async partnerFinance(organizationId: string): Promise<ExportData> {
    const rows = await this.pg.query(
      `SELECT booking_number, status, currency, total_amount::float8,
              commission_amount::float8, partner_payable::float8, created_at
       FROM bookings
       WHERE partner_organization_id = $1::uuid
       ORDER BY created_at DESC
       LIMIT $2`,
      [organizationId, REPORT_ROW_LIMIT],
    );

    return {
      kind: 'tabular',
      title: 'Moliyaviy hisobot',
      columns: [
        { key: 'booking_number', header: 'Bron raqami' },
        { key: 'status', header: 'Holat' },
        { key: 'currency', header: 'Valyuta' },
        { key: 'total_amount', header: 'Umumiy summa' },
        { key: 'commission_amount', header: 'Komissiya' },
        { key: 'partner_payable', header: "Sizga to'lanadigan" },
        { key: 'created_at', header: 'Sana' },
      ],
      rows,
    };
  }
}
