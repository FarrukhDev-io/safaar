import {
  AdminManagedUser,
  AdminListing,
  Partner,
  AdminHotelBooking,
  AdminBusBooking,
  AdminRestaurantBooking,
  PartnerRequest,
  CatalogAmenity,
  CatalogRegion,
  CmsArticle,
  CmsBanner,
  FinanceReport,
  PromoCode,
  SupportTicket,
  TicketMessage,
  WithdrawalRequest,
  BookingDetail,
  ActivityLogItem,
} from '../../types/admin';
import { BookingStatus } from '@safaar/types';
import apiClient from './client';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationSummary {
  partnerRequests: number;
  supportOpen: number;
}

export interface AdminSettings {
  commissionRate: string;
  busCommissionRate: string;
  maintenanceMode: boolean;
  contactEmail: string;
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}

function unknownItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  return [];
}

function localizedText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (isRecord(value)) {
    const translations = value;
    return String(
      translations.uz ?? translations.ru ?? translations.en ?? fallback,
    );
  }
  return fallback;
}

function asString(value: unknown, fallback = ''): string {
  return String(value ?? fallback);
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function upperStatus(value: unknown): string {
  return asString(value).toUpperCase();
}

function bookingStatus(value: unknown): AdminHotelBooking['status'] {
  const status = upperStatus(value);
  if (status === BookingStatus.AWAITING_PAYMENT) {
    return BookingStatus.AWAITING_PAYMENT;
  }
  if (status === BookingStatus.AWAITING_PARTNER_CONFIRMATION) {
    return BookingStatus.AWAITING_PARTNER_CONFIRMATION;
  }
  if (status === BookingStatus.CONFIRMED) return BookingStatus.CONFIRMED;
  if (status === BookingStatus.CANCELLED) return BookingStatus.CANCELLED;
  if (status === BookingStatus.COMPLETED) return BookingStatus.COMPLETED;
  if (status === BookingStatus.EXPIRED) return BookingStatus.EXPIRED;
  return BookingStatus.PENDING;
}

function paymentMethod(
  value: unknown,
): AdminHotelBooking['paymentMethod'] | AdminBusBooking['paymentMethod'] {
  const method = asString(value);
  return method === 'payme' || method === 'uzcard' || method === 'humo'
    ? method
    : 'click';
}

function withdrawalStatus(value: unknown): WithdrawalRequest['status'] {
  const status = asString(value).toLowerCase();
  if (status === 'approved' || status === 'paid') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function supportPriority(value: unknown): SupportTicket['priority'] {
  const priority = asString(value).toLowerCase();
  if (priority === 'low' || priority === 'high') return priority;
  return 'medium';
}

function supportStatus(value: unknown): SupportTicket['status'] {
  const status = asString(value).toLowerCase();
  if (status === 'in_progress' || status === 'closed') return status;
  return 'open';
}

function toRegion(row: ApiRecord): CatalogRegion {
  return {
    id: String(row.id ?? ''),
    name: localizedText(row.name, 'Hudud'),
    hotelsCount: Number(row.hotelsCount ?? row.hotels_count ?? 0),
    isActive: asBoolean(row.isActive ?? row.is_active, true),
  };
}

function toAmenity(row: ApiRecord): CatalogAmenity {
  return {
    id: String(row.id ?? row.code ?? ''),
    name: localizedText(row.name, 'Qulaylik'),
    icon: String(row.icon ?? row.code ?? 'amenity'),
    type: row.type === 'room' ? 'room' : 'hotel',
    isActive: asBoolean(row.isActive ?? row.is_active, true),
  };
}

function toPartner(row: ApiRecord): Partner {
  return {
    id: asString(row.id),
    companyName: asString(row.brand_name ?? row.legal_name, 'Hamkor'),
    type: partnerType(row.type),
    contactPerson: asString(row.legal_name ?? row.brand_name, "Mas'ul shaxs"),
    phone: asString(row.phone),
    email: asString(row.email),
    city: asString(row.city),
    address: asString(row.address),
    commissionPercent: asNumber(row.default_commission_rate),
    rating: asNumber(row.rating_average),
    totalBookings: asNumber(row.bookings_count),
    totalRevenue: asNumber(row.total_revenue),
    status:
      row.status === 'approved'
        ? 'active'
        : row.status === 'blocked'
          ? 'blocked'
          : row.status === 'suspended'
            ? 'suspended'
            : row.status === 'rejected'
              ? 'rejected'
              : 'reviewing',
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

function toPartnerRequest(row: ApiRecord): PartnerRequest {
  const rawStatus = asString(row.status).toLowerCase();

  return {
    id: asString(row.id),
    companyName: asString(row.brand_name ?? row.legal_name, 'Hamkor arizasi'),
    type: partnerType(row.type),
    contactPerson: asString(row.legal_name ?? row.brand_name, "Mas'ul shaxs"),
    phone: asString(row.phone),
    email: asString(row.email),
    city: asString(row.city),
    address: asString(row.address),
    documents: Array.isArray(row.documents) ? row.documents : [],
    status:
      rawStatus === 'approved'
        ? 'approved'
        : rawStatus === 'rejected' ||
            rawStatus === 'blocked' ||
            rawStatus === 'suspended'
          ? 'rejected'
          : rawStatus === 'submitted'
            ? 'submitted'
            : rawStatus === 'under_review' ||
                rawStatus === 'more_information_required'
              ? 'reviewing'
              : 'new',
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

function partnerType(value: unknown): Partner['type'] {
  const type = asString(value).toLowerCase();
  if (
    type === 'bus' ||
    type === 'hostel' ||
    type === 'guesthouse' ||
    type === 'motel' ||
    type === 'dacha' ||
    type === 'restaurant'
  ) {
    return type;
  }
  return 'hotel';
}

function listingPartnerType(value: unknown): AdminListing['partnerType'] {
  const type = asString(value).toLowerCase();
  if (
    type === 'hotel' ||
    type === 'hostel' ||
    type === 'guesthouse' ||
    type === 'motel' ||
    type === 'dacha' ||
    type === 'restaurant' ||
    type === 'mixed'
  ) {
    return type;
  }
  return 'hotel';
}

function toUser(row: ApiRecord): AdminManagedUser {
  const fullName = String(
    row.full_name ??
      [row.first_name, row.last_name].filter(Boolean).join(' ') ??
      '',
  ).trim();

  return {
    id: asString(row.id),
    fullName: fullName || 'Foydalanuvchi',
    phone: asString(row.phone),
    email: asString(row.email),
    status:
      row.status === 'blocked'
        ? 'blocked'
        : row.status === 'unverified'
          ? 'unverified'
          : 'active',
    bookingsCount: asNumber(row.bookings_count),
    totalSpent: asNumber(row.total_spent),
    bonusBalance: asNumber(row.bonus_balance),
    lastLogin: asString(
      row.last_login_at ?? row.created_at,
      new Date().toISOString(),
    ),
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

function toHotelBooking(row: ApiRecord): AdminHotelBooking {
  const item = asRecord(row.item);
  return {
    id: asString(row.id),
    partnerId: asString(row.partner_organization_id),
    customerName: asString(row.customer_name, 'Mijoz'),
    customerPhone: asString(row.customer_phone),
    hotelName: asString(row.hotel_name, 'Mehmonxona'),
    partnerType: (['hotel', 'motel', 'hostel', 'dacha', 'guesthouse'] as const).includes(
      row.partner_type as never,
    )
      ? (row.partner_type as AdminHotelBooking['partnerType'])
      : 'hotel',
    roomType: asString(row.room_type_name, 'Xona'),
    checkIn: asString(row.check_in ?? item.check_in),
    checkOut: asString(row.check_out ?? item.check_out),
    nights: asNumber(item.nights, 1),
    guests: asNumber(item.adults, 1) + asNumber(item.children),
    amount: asNumber(row.total_amount),
    paymentMethod: paymentMethod(row.payment_method),
    commission: asNumber(row.commission_amount),
    status: bookingStatus(row.status),
    city: asString(row.city),
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

function toBusBooking(row: ApiRecord): AdminBusBooking {
  return {
    id: asString(row.id),
    partnerId: asString(row.partner_organization_id),
    customerName: asString(row.customer_name, 'Mijoz'),
    customerPhone: asString(row.customer_phone),
    companyName: asString(row.company_name),
    route: asString(row.route),
    departureDate: asString(row.departure_date),
    departureTime: asString(row.departure_time),
    seatNumber: asString(row.seat_number),
    amount: asNumber(row.total_amount),
    paymentMethod: paymentMethod(row.payment_method),
    commission: asNumber(row.commission_amount),
    status: bookingStatus(row.status),
    createdAt: asString(row.created_at, new Date().toISOString()),
  };
}

function toRestaurantBooking(row: ApiRecord): AdminRestaurantBooking {
  const item = asRecord(row.item);
  const priceSnapshot = asRecord(row.price_snapshot ?? row.priceSnapshot);
  return {
    id: asString(row.booking_number ?? row.bookingNumber ?? row.id),
    customerName: asString(
      row.guest_name ??
        row.guestName ??
        priceSnapshot.guestName ??
        priceSnapshot.guest_name ??
        row.user_name ??
        row.userName ??
        row.customer_name ??
        row.customerName,
      'Mijoz',
    ),
    customerPhone: asString(
      row.guest_phone ??
        row.guestPhone ??
        priceSnapshot.guestPhone ??
        priceSnapshot.guest_phone ??
        row.user_phone ??
        row.userPhone ??
        row.customer_phone ??
        row.customerPhone,
      '—',
    ),
    restaurantName: asString(
      row.hotel_name ??
        row.hotelName ??
        item.name ??
        row.partner_name ??
        row.partnerName,
      'Restoran',
    ),
    tableType: asString(
      priceSnapshot.tableName ??
        priceSnapshot.room_type ??
        priceSnapshot.roomType ??
        item.room_type,
      'Stol',
    ),
    date: asString(
      priceSnapshot.check_in ??
        priceSnapshot.checkIn ??
        row.created_at ??
        row.createdAt,
      new Date().toISOString().split('T')[0],
    ),
    slotTime: asString(
      priceSnapshot.slot_time ??
        priceSnapshot.slotTime ??
        row.slot_time ??
        row.slotTime,
      '18:00',
    ),
    guests: asNumber(
      priceSnapshot.adults ?? priceSnapshot.guests ?? row.guests,
      2,
    ),
    amount: asNumber(row.total_amount ?? row.totalAmount ?? row.subtotal),
    paymentMethod: paymentMethod(row.payment_method ?? row.paymentMethod),
    commission: asNumber(row.commission_amount ?? row.commissionAmount),
    status: bookingStatus(row.status),
    createdAt: asString(row.created_at ?? row.createdAt, new Date().toISOString()),
  };
}

function toBookingDetail(row: ApiRecord): BookingDetail {
  const item = asRecord(row.item);
  return {
    id: asString(row.id),
    serviceType: row.type === 'bus' ? 'bus' : 'hotel',
    status: bookingStatus(row.status),
    createdAt: asString(row.created_at, new Date().toISOString()),
    customerName: asString(row.customer_name, 'Mijoz'),
    customerPhone: asString(row.customer_phone),
    customerEmail: asString(row.customer_email),
    customerId: asString(row.user_id),
    hotelName: asString(row.hotel_name),
    hotelAddress: asString(row.hotel_address),
    roomType: asString(row.room_type_name ?? item.room_type),
    checkIn: asString(row.check_in ?? item.check_in),
    checkOut: asString(row.check_out ?? item.check_out),
    nights: asNumber(item.nights, 1),
    guests: asNumber(item.adults, 1) + asNumber(item.children),
    companyName: asString(row.company_name ?? item.companyName),
    route: asString(row.route ?? item.route),
    departureDate: asString(row.departure_date),
    departureTime: asString(row.departure_time),
    seatNumber: asString(row.seat_number ?? item.seatNumber),
    paymentMethod: paymentMethod(row.payment_method),
    totalAmount: asNumber(row.total_amount),
    commission: asNumber(row.commission_amount),
    partnerAmount: asNumber(row.partner_payable),
    transactionId: asString(row.transaction_id),
    paidAt: asString(row.paid_at ?? row.created_at, new Date().toISOString()),
    statusHistory: unknownItems(row.status_history).length
      ? unknownItems(row.status_history).map((entry) => {
          const history = asRecord(entry);
          return {
            status: asString(history.status, asString(row.status)),
            timestamp: asString(
              history.timestamp ?? history.created_at,
              new Date().toISOString(),
            ),
            note:
              history.note === undefined ? undefined : asString(history.note),
          };
        })
      : [
          {
            status: asString(row.status),
            timestamp: asString(row.created_at, new Date().toISOString()),
          },
        ],
  };
}

function toListing(row: ApiRecord): AdminListing {
  const partner = asRecord(row.partner);
  const rawRules = isRecord(row.rules) ? row.rules : undefined;
  const roomSummary = asRecord(row.room_summary);
  const rawPhotos = Array.isArray(row.photos)
    ? row.photos
    : Array.isArray(row.images)
      ? row.images
      : Array.isArray(row.media)
        ? row.media
        : [];
  const photos = rawPhotos.flatMap((photo) => {
    if (typeof photo === 'string') return [photo];
    const record = asRecord(photo);
    return typeof record.url === 'string' ? [record.url] : [];
  });
  const amenities = Array.isArray(row.amenities)
    ? row.amenities.map((amenity) => {
        const record = asRecord(amenity);
        return typeof amenity === 'string'
          ? amenity
          : localizedText(record.name, asString(record.code, 'Qulaylik'));
      })
    : [];

  return {
    id: asString(row.id),
    partnerId: asString(row.partner_organization_id),
    partnerType: listingPartnerType(row.partner_type ?? partner.type),
    companyName: localizedText(
      row.company_name ??
        row.brand_name ??
        row.legal_name ??
        partner.brand_name ??
        partner.legal_name,
    ),
    hotelName: localizedText(row.name, asString(row.slug, 'Mehmonxona')),
    city: localizedText(row.city_name ?? row.city),
    address: asString(row.address),
    latitude: asOptionalNumber(row.latitude),
    longitude: asOptionalNumber(row.longitude),
    stars: asNumber(row.stars),
    photos,
    description: localizedText(
      row.description ?? row.full_description ?? row.short_description,
    ),
    amenities,
    rules: rawRules
      ? {
          checkInTime:
            rawRules.checkInTime === undefined &&
            rawRules.check_in_time === undefined
              ? undefined
              : asString(rawRules.checkInTime ?? rawRules.check_in_time),
          checkOutTime:
            rawRules.checkOutTime === undefined &&
            rawRules.check_out_time === undefined
              ? undefined
              : asString(rawRules.checkOutTime ?? rawRules.check_out_time),
          childrenAllowed: asOptionalBoolean(
            rawRules.childrenAllowed ?? rawRules.children_allowed,
          ),
          petsAllowed: asOptionalBoolean(
            rawRules.petsAllowed ?? rawRules.pets_allowed,
          ),
          smokingAllowed: asOptionalBoolean(
            rawRules.smokingAllowed ?? rawRules.smoking_allowed,
          ),
          cancellationPolicy:
            rawRules.cancellationPolicy === undefined &&
            rawRules.cancellation_policy_code === undefined
              ? undefined
              : asString(
                  rawRules.cancellationPolicy ??
                    rawRules.cancellation_policy_code,
                ),
        }
      : undefined,
    roomsCount: asOptionalNumber(
      row.rooms_count ??
        roomSummary.active_room_count ??
        roomSummary.total_inventory,
    ),
    status:
      row.status === 'published'
        ? 'published'
        : row.status === 'rejected'
          ? 'rejected'
          : row.status === 'draft'
            ? 'draft'
            : 'under_review',
    submittedAt: asString(
      row.submitted_at ?? row.created_at,
      new Date().toISOString(),
    ),
    completeness: isRecord(row.completeness)
      ? {
          isPublishable: Boolean(
            row.completeness.is_publishable ?? row.completeness.isPublishable,
          ),
          missingFields: Array.isArray(
            row.completeness.missing_fields ?? row.completeness.missingFields,
          )
            ? ((row.completeness.missing_fields ??
                row.completeness.missingFields) as unknown[]).map((field) =>
                String(field),
              )
            : [],
        }
      : undefined,
  };
}

function toPromo(row: ApiRecord): PromoCode {
  const discountType = asString(row.discountType ?? row.discount_type)
    .toLowerCase()
    .startsWith('percent')
    ? 'percent'
    : 'fixed';
  const active = row.isActive ?? row.is_active;

  return {
    id: asString(row.id ?? row.code),
    code: asString(row.code, 'PROMO').toUpperCase(),
    discountType,
    discountValue: asNumber(row.discountValue ?? row.discount_value),
    usageLimit: asNumber(row.usageLimit ?? row.usage_limit),
    usedCount: asNumber(row.usedCount ?? row.used_count),
    validUntil: asString(
      row.validUntil ?? row.valid_until ?? row.updated_at,
      new Date().toISOString(),
    ),
    isActive:
      typeof active === 'boolean'
        ? active
        : asString(row.status, 'published') === 'published',
  };
}

function toCmsBanner(row: ApiRecord): CmsBanner {
  const metadata = asRecord(row.metadata);
  return {
    id: asString(row.id),
    title: localizedText(row.title, asString(row.slug, 'Banner')),
    imageUrl: asString(row.imageUrl ?? row.image_url ?? metadata.imageUrl),
    link: asString(row.link ?? metadata.link, '/'),
    isActive:
      typeof row.isActive === 'boolean'
        ? row.isActive
        : asString(row.status) === 'published' ||
          asString(row.status) === 'active',
    order: asNumber(row.order ?? metadata.order),
  };
}

function toCmsArticle(row: ApiRecord, type?: CmsArticle['type']): CmsArticle {
  const rowType = asString(row.type);
  const articleType: CmsArticle['type'] =
    type ??
    (rowType === 'offer' || rowType === 'promo'
      ? 'offer'
      : rowType === 'page'
        ? 'page'
        : 'news');

  return {
    id: asString(row.id),
    title: localizedText(row.title, asString(row.slug, 'Kontent')),
    type: articleType,
    slug: asString(row.slug),
    status: asString(row.status) === 'published' ? 'published' : 'draft',
    publishedAt: asString(
      row.publishedAt ?? row.published_at ?? row.created_at,
      new Date().toISOString(),
    ),
  };
}

function toWithdrawal(row: ApiRecord): WithdrawalRequest {
  return {
    id: asString(row.id),
    partnerId: asString(row.partnerId ?? row.partner_id),
    partnerName: asString(row.partnerName ?? row.partner_name, 'Hamkor'),
    amount: asNumber(row.amount),
    requestDate: asString(
      row.requestDate ?? row.request_date ?? row.created_at,
      new Date().toISOString(),
    ),
    status: withdrawalStatus(row.status),
    bankAccount: asString(row.bankAccount ?? row.bank_account),
  };
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  support_tickets: "Support so'rovi",
  partner_organizations: 'Hamkor tashkiloti',
  bookings: 'Bron',
  users: 'Foydalanuvchi',
  hotels: 'Mehmonxona',
  partners: 'Hamkor',
};

function auditTargetLabel(rawTarget: string): string {
  if (!rawTarget) return '—';
  const separatorIndex = rawTarget.indexOf(':');
  if (separatorIndex === -1) return rawTarget;
  const entityType = rawTarget.slice(0, separatorIndex);
  const entityId = rawTarget.slice(separatorIndex + 1);
  if (!entityType) return entityId;
  const label = ENTITY_TYPE_LABELS[entityType] ?? entityType;
  const shortId = entityId.length > 8 ? `…${entityId.slice(-8)}` : entityId;
  return entityId ? `${label} (${shortId})` : label;
}

function toAuditLog(row: ApiRecord) {
  const metadata = asRecord(row.metadata);
  return {
    id: asString(row.id),
    user: asString(row.actor_name ?? row.actor_id ?? row.actor_type, 'Admin'),
    action: activityMessage(asString(row.action), metadata),
    target: auditTargetLabel(
      asString(metadata.target ?? row.entity_id ?? row.entity_type ?? row.request_id),
    ),
    ip: asString(row.ip_address),
    date: asString(row.created_at, new Date().toISOString()),
  };
}

const SETTINGS_GROUP_LABELS: Record<string, string> = {
  general: "Umumiy sozlamalar",
  finance: 'Moliya sozlamalari',
  notifications: 'Bildirishnoma sozlamalari',
};

function activityMessage(action: string, metadata: ApiRecord): string {
  switch (action) {
    case 'partner.moderation': {
      const status = asString(metadata.status);
      const verdict =
        status === 'approved'
          ? 'tasdiqlandi'
          : status === 'rejected'
            ? 'rad etildi'
            : status || "ko'rib chiqildi";
      return `Hamkor arizasi ${verdict}`;
    }
    case 'partner.status':
      return `Hamkor holati o'zgartirildi: ${asString(metadata.status, '—')}`;
    case 'partner.commission':
      return "Hamkor komissiya foizi o'zgartirildi";
    case 'partner.adjustment':
      return "Hamkor balansiga tuzatish kiritildi";
    case 'partner.delete':
      return "Hamkor o'chirildi";
    case 'settings.update': {
      const group = asString(metadata.group);
      return `Sozlamalar yangilandi: ${SETTINGS_GROUP_LABELS[group] ?? (group || 'umumiy')}`;
    }
    case 'booking.admin_cancel':
      return 'Bron administrator tomonidan bekor qilindi';
    case 'user.admin_delete':
      return "Foydalanuvchi o'chirildi";
    case 'user.admin_message':
      return 'Foydalanuvchiga xabar yuborildi';
    case 'user.bonus_adjustment':
      return "Foydalanuvchi bonus balansi o'zgartirildi";
    case 'partner_request':
      return 'Yangi hamkor arizasi tushdi';
    case 'booking_created':
      return 'Yangi bron yaratildi';
    case 'booking_cancelled':
      return 'Bron bekor qilindi';
    case 'complaint':
      return 'Yangi shikoyat/murojaat tushdi';
    case 'user_registered':
      return "Yangi foydalanuvchi ro'yxatdan o'tdi";
    default:
      return action || 'Admin harakati';
  }
}

function toActivityLog(row: ApiRecord): ActivityLogItem {
  const action = asString(row.action);
  const metadata = asRecord(row.metadata);
  const type: ActivityLogItem['type'] = action.includes('partner')
    ? 'partner_request'
    : action.includes('booking') || action.includes('bron')
      ? action.includes('cancel')
        ? 'booking_cancelled'
        : 'booking_created'
      : action.includes('payment') || action.includes('withdrawal')
        ? 'payment_request'
        : action.includes('support') || action.includes('complaint')
          ? 'complaint'
          : 'user_registered';
  const icon =
    type === 'partner_request'
      ? 'Building'
      : type === 'payment_request'
        ? 'Wallet'
        : type === 'booking_cancelled'
          ? 'XCircle'
          : type === 'complaint'
            ? 'AlertTriangle'
            : type === 'booking_created'
              ? 'CalendarPlus'
              : 'UserPlus';

  return {
    id: asString(row.id),
    type,
    message: activityMessage(action, metadata),
    timestamp: asString(row.created_at, new Date().toISOString()),
    icon,
  };
}

function toFinanceReport(row: ApiRecord, index: number): FinanceReport {
  const partnerName = asString(
    row.partner_name ?? row.brand_name ?? row.legal_name,
    'Hamkor',
  );
  const generatedAt = asString(row.created_at, new Date().toISOString());
  return {
    id: asString(row.id ?? row.partner_id, `finance-report-${index}`),
    title: asString(row.title, `${partnerName} moliya hisoboti`),
    period: asString(row.period, 'Joriy davr'),
    totalRevenue: asNumber(row.totalRevenue ?? row.total_revenue),
    totalCommission: asNumber(
      row.totalCommission ?? row.total_commission ?? row.commission,
    ),
    dateGenerated: asString(
      row.dateGenerated ?? row.date_generated,
      generatedAt,
    ),
  };
}

function toNotification(row: ApiRecord): AdminNotification {
  return {
    id: asString(row.id),
    title: localizedText(row.title, 'Bildirishnoma'),
    message: localizedText(row.message ?? row.body, ''),
    isRead: Boolean(row.isRead ?? row.is_read ?? row.read_at),
    createdAt: asString(
      row.createdAt ?? row.created_at,
      new Date().toISOString(),
    ),
  };
}

function toSupportTicket(row: ApiRecord): SupportTicket {
  const customerName = asString(
    row.contact_name ?? row.contactName ?? row.customer_name ?? row.customerName,
    'Mijoz',
  ).trim();
  const businessName =
    localizedText(
      row.business_name ??
        row.businessName ??
        row.partner_name ??
        row.partnerName ??
        row.organization_name ??
        row.organizationName,
    ).trim() || undefined;
  const hotelName =
    localizedText(row.hotel_name ?? row.hotelName, '').trim() || undefined;
  const companyName =
    localizedText(row.company_name ?? row.companyName, '').trim() || undefined;
  const taxId =
    asString(
      row.tax_id ??
        row.taxId ??
        row.stir ??
        row.partner_tax_id ??
        row.partnerTaxId,
    ).trim() || undefined;

  return {
    id: asString(row.id),
    subject: asString(row.subject, 'Murojaat'),
    customerName: customerName || 'Mijoz',
    customerType: row.customer_type === 'partner' ? 'partner' : 'user',
    contactName: customerName || undefined,
    businessName,
    hotelName,
    companyName,
    taxId,
    partnerId:
      asString(
        row.partner_organization_id ??
          row.partnerOrganizationId ??
          row.partner_id ??
          row.partnerId,
      ).trim() || undefined,
    status: supportStatus(row.status),
    priority: supportPriority(row.priority),
    assignee:
      row.assignee === undefined && row.assignee_name === undefined
        ? undefined
        : asString(row.assignee ?? row.assignee_name),
    createdAt: asString(
      row.created_at ?? row.createdAt,
      new Date().toISOString(),
    ),
  };
}

function toTicketMessage(row: ApiRecord): TicketMessage {
  return {
    id: asString(row.id),
    ticketId: asString(row.ticketId ?? row.ticket_id),
    senderName: asString(row.senderName ?? row.sender_name, 'Foydalanuvchi'),
    senderRole:
      row.sender_type === 'admin' || row.senderRole === 'admin'
        ? 'admin'
        : 'customer',
    message: asString(row.message ?? row.body),
    createdAt: asString(
      row.createdAt ?? row.created_at,
      new Date().toISOString(),
    ),
  };
}

function cmsBannerPayload(banner: Omit<CmsBanner, 'id'> | Partial<CmsBanner>) {
  return {
    slug:
      typeof banner.title === 'string'
        ? banner.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')
        : undefined,
    title: { uz: banner.title ?? '' },
    metadata: {
      imageUrl: banner.imageUrl ?? '',
      link: banner.link ?? '/',
      order: banner.order ?? 0,
    },
  };
}

export const AdminApi = {
  // Auth
  login: async (username: string, password: string) => {
    const { data } = await apiClient.post('/auth/admin/login', {
      username,
      password,
    });
    if (data.requires_2fa) {
      throw new Error('2FA kerak');
    }
    const token = data.accessToken ?? data.access_token;
    if (!token) {
      throw new Error('Login token qaytmadi');
    }
    return {
      token,
      user: {
        id: data.admin?.id ?? 'admin',
        name: data.admin?.full_name ?? data.admin?.email ?? 'Admin',
        email: data.admin?.email ?? username,
        role: data.admin?.role ?? 'SUPER_ADMIN',
      },
    };
  },

  // Users
  getUsers: async (): Promise<AdminManagedUser[]> => {
    const { data } = await apiClient.get('/admin/users');
    return unknownItems(data).map((row) => toUser(asRecord(row)));
  },

  getUser: async (id: string): Promise<AdminManagedUser> => {
    const { data } = await apiClient.get(`/admin/users/${id}`);
    return toUser(asRecord(data));
  },

  updateUserStatus: async (
    id: string,
    status: AdminManagedUser['status'],
  ): Promise<AdminManagedUser> => {
    const { data } = await apiClient.patch(`/admin/users/${id}/status`, {
      status,
    });
    return toUser(asRecord(data));
  },

  deleteUser: async (id: string): Promise<AdminManagedUser> => {
    const { data } = await apiClient.delete(`/admin/users/${id}`);
    return toUser(asRecord(data));
  },

  getUserBookings: async (id: string): Promise<AdminHotelBooking[]> => {
    const { data } = await apiClient.get(`/admin/users/${id}/bookings`);
    return unknownItems(data).map((row) => toHotelBooking(asRecord(row)));
  },

  adjustUserBonus: async (id: string, amount: number, reason?: string): Promise<number> => {
    const { data } = await apiClient.post(`/admin/users/${id}/bonus-adjustment`, {
      amount,
      reason,
    });
    return asNumber(asRecord(data).balance);
  },

  // Partners
  getPartners: async (): Promise<Partner[]> => {
    const { data } = await apiClient.get('/admin/partners');
    return unknownItems(data).map((row) => toPartner(asRecord(row)));
  },

  getPartner: async (id: string): Promise<Partner> => {
    const { data } = await apiClient.get(`/admin/partners/${id}`);
    return toPartner(asRecord(data));
  },

  getPartnerRequests: async (): Promise<PartnerRequest[]> => {
    const { data } = await apiClient.get('/admin/partners/requests');
    return unknownItems(data)
      .map((row) => asRecord(row))
      .filter((row) =>
        ['submitted', 'under_review', 'more_information_required'].includes(
          asString(row.status).toLowerCase(),
        ),
      )
      .map((row) => toPartnerRequest(row));
  },

  approvePartner: async (id: string) => {
    const { data } = await apiClient.post(`/admin/partners/${id}/approve`);
    return data;
  },

  rejectPartner: async (id: string, reason?: string) => {
    const { data } = await apiClient.post(`/admin/partners/${id}/reject`, {
      reason: reason ?? '',
    });
    return data;
  },

  updatePartnerStatus: async (id: string, status: Partner['status']) => {
    const { data } = await apiClient.patch(`/admin/partners/${id}/status`, {
      status,
    });
    return toPartner(asRecord(data));
  },

  deletePartner: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/partners/${id}`);
    return data;
  },

  updatePartnerCommission: async (id: string, rate: number) => {
    const { data } = await apiClient.patch(`/admin/partners/${id}/commission`, {
      rate,
    });
    return toPartner(asRecord(data));
  },

  // Bookings
  getBookings: async (): Promise<AdminHotelBooking[]> => {
    const { data } = await apiClient.get('/admin/bookings');
    return unknownItems(data)
      .map(asRecord)
      .filter((booking) => booking.type !== 'bus' && booking.type !== 'restaurant')
      .map(toHotelBooking);
  },

  getBusBookings: async (): Promise<AdminBusBooking[]> => {
    const { data } = await apiClient.get('/admin/bookings');
    return unknownItems(data)
      .map(asRecord)
      .filter((booking) => booking.type === 'bus')
      .map(toBusBooking);
  },

  getRestaurantBookings: async (): Promise<AdminRestaurantBooking[]> => {
    const { data } = await apiClient.get('/admin/bookings');
    return unknownItems(data)
      .map(asRecord)
      .filter((booking) => booking.type === 'restaurant')
      .map(toRestaurantBooking);
  },

  getBookingDetail: async (id: string): Promise<BookingDetail> => {
    const { data } = await apiClient.get(`/admin/bookings/${id}`);
    return toBookingDetail(asRecord(data));
  },

  cancelBooking: async (
    id: string,
    reason?: string,
  ): Promise<BookingDetail> => {
    await apiClient.post(`/admin/bookings/${id}/cancel`, {
      reason: reason ?? 'Admin cancel',
    });
    return AdminApi.getBookingDetail(id);
  },

  // Dashboard
  getDashboardStats: async () => {
    const { data } = await apiClient.get('/admin/dashboard/overview');
    return {
      totalUsers: data.totalUsers ?? data.total_users ?? 0,
      totalPartners:
        data.activePartners ?? data.active_partners ?? data.total_partners ?? 0,
      totalBookings:
        data.todayBookings ?? data.today_bookings ?? data.total_bookings ?? 0,
      revenue: data.monthlyRevenue ?? data.monthly_revenue ?? data.revenue ?? 0,
    };
  },

  getActivity: async (): Promise<ActivityLogItem[]> => {
    const { data } = await apiClient.get('/admin/dashboard/activity');
    return unknownItems(data).map((row) => toActivityLog(asRecord(row)));
  },

  getAuditLogs: async () => {
    const { data } = await apiClient.get('/admin/audit-logs');
    return unknownItems(data).map((row) => toAuditLog(asRecord(row)));
  },

  getNotificationSummary: async (): Promise<AdminNotificationSummary> => {
    const [partnerRequests, supportStatsResponse] = await Promise.all([
      AdminApi.getPartnerRequests(),
      apiClient.get('/admin/support/stats'),
    ]);
    const supportStats = asRecord(supportStatsResponse.data);

    return {
      partnerRequests: partnerRequests.filter(
        (request) => request.status === 'new' || request.status === 'reviewing',
      ).length,
      supportOpen: Number(supportStats.open ?? 0),
    };
  },

  getNotifications: async (): Promise<AdminNotification[]> => {
    const { data } = await apiClient.get('/notifications');
    return unknownItems(data).map((row) => toNotification(asRecord(row)));
  },

  markNotificationRead: async (id: string): Promise<AdminNotification> => {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return toNotification(asRecord(data));
  },

  markAllNotificationsRead: async () => {
    const { data } = await apiClient.patch('/notifications/read-all');
    return data;
  },

  getSettings: async (): Promise<AdminSettings> => {
    const { data } = await apiClient.get('/admin/settings');
    return {
      commissionRate: String(
        data.finance?.hotel_commission_rate ??
          data.general?.hotel_commission_rate ??
          15,
      ),
      busCommissionRate: String(
        data.finance?.bus_commission_rate ??
          data.general?.bus_commission_rate ??
          10,
      ),
      maintenanceMode: Boolean(
        data.general?.maintenance_mode ?? data.maintenance_mode ?? false,
      ),
      contactEmail: String(
        data.general?.support_email ??
          data.support?.email ??
          data.support_email ??
          'support@safaar.uz',
      ),
    };
  },

  updateSettings: async (settings: AdminSettings) => {
    const [general, finance] = await Promise.all([
      apiClient.patch('/admin/settings/general', {
        support_email: settings.contactEmail,
        maintenance_mode: settings.maintenanceMode,
      }),
      apiClient.patch('/admin/settings/finance', {
        hotel_commission_rate: Number(settings.commissionRate),
        bus_commission_rate: Number(settings.busCommissionRate),
      }),
    ]);

    return { general: general.data, finance: finance.data };
  },

  updateGeneralSettings: async (
    settings: Pick<AdminSettings, 'contactEmail' | 'maintenanceMode'>,
  ) => {
    const { data } = await apiClient.patch('/admin/settings/general', {
      support_email: settings.contactEmail,
      maintenance_mode: settings.maintenanceMode,
    });
    return data;
  },

  // Finance
  getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    const { data } = await apiClient.get('/admin/withdrawals');
    return unknownItems(data).map((row) => toWithdrawal(asRecord(row)));
  },

  approveWithdrawal: async (id: string): Promise<WithdrawalRequest> => {
    const { data } = await apiClient.post(`/admin/withdrawals/${id}/approve`);
    return toWithdrawal(asRecord(data));
  },

  rejectWithdrawal: async (id: string): Promise<WithdrawalRequest> => {
    const { data } = await apiClient.post(`/admin/withdrawals/${id}/reject`);
    return toWithdrawal(asRecord(data));
  },

  getFinanceReports: async (): Promise<FinanceReport[]> => {
    const { data } = await apiClient.get('/admin/finance/partners-report');
    return unknownItems(data).map((row, index) =>
      toFinanceReport(asRecord(row), index),
    );
  },

  // CMS
  getCmsBanners: async (): Promise<CmsBanner[]> => {
    const { data } = await apiClient.get('/admin/cms/banners');
    return unknownItems(data).map((row) => toCmsBanner(asRecord(row)));
  },
  getCmsNews: async (): Promise<CmsArticle[]> => {
    const { data } = await apiClient.get('/admin/cms/news');
    return unknownItems(data).map((row) => toCmsArticle(asRecord(row), 'news'));
  },
  getCmsPages: async (): Promise<CmsArticle[]> => {
    const { data } = await apiClient.get('/admin/cms/pages');
    return unknownItems(data).map((row) => toCmsArticle(asRecord(row), 'page'));
  },
  getCmsOffers: async (): Promise<CmsArticle[]> => {
    const { data } = await apiClient.get('/admin/cms/offers');
    return unknownItems(data).map((row) =>
      toCmsArticle(asRecord(row), 'offer'),
    );
  },
  createCmsBanner: async (
    banner: Omit<CmsBanner, 'id'>,
  ): Promise<CmsBanner> => {
    const { data } = await apiClient.post(
      '/admin/cms/banners',
      cmsBannerPayload(banner),
    );
    if (banner.isActive) {
      await apiClient.post(`/admin/cms/banners/${data.id}/publish`);
      return AdminApi.getCmsBanners().then(
        (banners) =>
          banners.find((item) => item.id === data.id) ??
          toCmsBanner(asRecord(data)),
      );
    }
    return toCmsBanner(asRecord(data));
  },
  updateCmsBanner: async (
    id: string,
    banner: Partial<CmsBanner>,
  ): Promise<CmsBanner> => {
    const { data } = await apiClient.patch(
      `/admin/cms/banners/${id}`,
      cmsBannerPayload(banner),
    );
    if (typeof banner.isActive === 'boolean') {
      const action = await apiClient.post(
        `/admin/cms/banners/${id}/${banner.isActive ? 'publish' : 'unpublish'}`,
      );
      return toCmsBanner(asRecord(action.data));
    }
    return toCmsBanner(asRecord(data));
  },
  setCmsBannerActive: async (
    id: string,
    isActive: boolean,
  ): Promise<CmsBanner> => {
    const { data } = await apiClient.post(
      `/admin/cms/banners/${id}/${isActive ? 'publish' : 'unpublish'}`,
    );
    return toCmsBanner(asRecord(data));
  },
  deleteCmsBanner: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/cms/banners/${id}/archive`);
  },

  // Catalog
  getRegions: async (): Promise<CatalogRegion[]> => {
    const { data } = await apiClient.get('/catalog/regions');
    return unknownItems(data).map((row) => toRegion(asRecord(row)));
  },
  createRegion: async (name: string): Promise<CatalogRegion> => {
    const { data } = await apiClient.post('/admin/catalog/regions', { name });
    return toRegion(asRecord(data));
  },
  updateRegion: async (id: string, name: string): Promise<CatalogRegion> => {
    const { data } = await apiClient.patch(`/admin/catalog/regions/${id}`, { name });
    return toRegion(asRecord(data));
  },
  deleteRegion: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/catalog/regions/${id}`);
  },
  getAmenities: async (): Promise<CatalogAmenity[]> => {
    const { data } = await apiClient.get('/catalog/amenities');
    return unknownItems(data).map((row) => toAmenity(asRecord(row)));
  },
  createAmenity: async (code: string, name: string): Promise<CatalogAmenity> => {
    const { data } = await apiClient.post('/admin/catalog/amenities', { code, name });
    return toAmenity(asRecord(data));
  },
  updateAmenity: async (id: string, name: string): Promise<CatalogAmenity> => {
    const { data } = await apiClient.patch(`/admin/catalog/amenities/${id}`, { name });
    return toAmenity(asRecord(data));
  },
  deleteAmenity: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/catalog/amenities/${id}`);
  },

  // Promos
  getPromos: async (): Promise<PromoCode[]> => {
    const { data } = await apiClient.get('/admin/promos');
    return unknownItems(data).map((row) => toPromo(asRecord(row)));
  },
  createPromo: async (input: {
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    usageLimit: number;
    validUntil?: string;
  }): Promise<void> => {
    // Backend `POST /admin/promos` javobi cms_entries'ning xom
    // (title/metadata) shaklida qaytadi — `getPromos()` esa alohida,
    // tekislangan SQL proyeksiyasidan o'qiydi. Shu farq tufayli ro'yxatni
    // yaratishdan keyin qayta yuklab olish kerak (bu funksiya faqat POST
    // qiladi, chaqiruvchi keyin `getPromos()`ni qayta chaqiradi).
    await apiClient.post('/admin/promos', {
      code: input.code,
      discountType: input.discountType === 'percent' ? 'percentage' : 'fixed',
      discountValue: input.discountValue,
      usageLimit: input.usageLimit,
      validUntil: input.validUntil || undefined,
    });
  },
  updatePromo: async (
    id: string,
    input: {
      code: string;
      discountType: 'percent' | 'fixed';
      discountValue: number;
      usageLimit: number;
      validUntil?: string;
      isActive: boolean;
    },
  ): Promise<void> => {
    await apiClient.patch(`/admin/promos/${id}`, {
      code: input.code,
      discountType: input.discountType === 'percent' ? 'percentage' : 'fixed',
      discountValue: input.discountValue,
      usageLimit: input.usageLimit,
      validUntil: input.validUntil || undefined,
      isActive: input.isActive,
    });
  },
  deletePromo: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/promos/${id}`);
  },

  // Support
  getTickets: async (): Promise<SupportTicket[]> => {
    const { data } = await apiClient.get('/admin/support/tickets');
    return unknownItems(data).map((row) => toSupportTicket(asRecord(row)));
  },
  getTicketMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    const { data } = await apiClient.get(`/admin/support/tickets/${ticketId}`);
    return unknownItems(data.messages).map((row) =>
      toTicketMessage(asRecord(row)),
    );
  },
  sendMessage: async (
    ticketId: string,
    message: string,
  ): Promise<TicketMessage> => {
    const { data } = await apiClient.post(
      `/admin/support/tickets/${ticketId}/messages`,
      {
        message,
      },
    );
    return toTicketMessage(asRecord(data));
  },
  updateTicketStatus: async (
    ticketId: string,
    status: string,
  ): Promise<void> => {
    await apiClient.patch(`/admin/support/tickets/${ticketId}/status`, {
      status,
    });
  },

  // Listings (Hotels moderation)
  getListings: async (): Promise<AdminListing[]> => {
    const { data } = await apiClient.get('/admin/hotels');
    return unknownItems(data).map((row) => toListing(asRecord(row)));
  },

  getListing: async (id: string): Promise<AdminListing> => {
    const { data } = await apiClient.get(`/admin/hotels/${id}`);
    return toListing(asRecord(data));
  },

  approveListing: async (id: string) => {
    const { data } = await apiClient.post(`/admin/hotels/${id}/publish`);
    return data;
  },

  rejectListing: async (id: string, reason?: string) => {
    const { data } = await apiClient.post(`/admin/hotels/${id}/reject`, {
      reason: reason ?? '',
    });
    return data;
  },
};
