import type { BookingStatus } from '@safaar/types';

/* ────────────────────────────────────────────
   Admin User
   ──────────────────────────────────────────── */

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'MODERATOR'
  | 'FINANCE_ADMIN'
  | 'CONTENT_ADMIN';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  phone: string;
  avatar?: string;
  lastLogin: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminListing {
  id: string;
  partnerId: string;
  companyName: string;
  hotelName: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  stars: number;
  photos?: string[];
  description?: string;
  amenities?: string[];
  rules?: {
    checkInTime?: string;
    checkOutTime?: string;
    childrenAllowed?: boolean;
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    cancellationPolicy?: string;
  };
  roomsCount?: number;
  status: 'draft' | 'under_review' | 'published' | 'rejected';
  submittedAt: string;
}

/* ────────────────────────────────────────────
   Dashboard
   ──────────────────────────────────────────── */

export interface DashboardStat {
  label: string;
  value: string;
  change?: number; // +12% yoki -5%
  icon: string;
  color: string;
}

export interface BookingTrend {
  date: string;
  hotels: number;
  buses: number;
}

export interface RevenueData {
  month: string;
  commission: number;
  partnerPayment: number;
}

export interface ServiceDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ActivityLogItem {
  id: string;
  type:
    | 'user_registered'
    | 'partner_request'
    | 'booking_created'
    | 'booking_cancelled'
    | 'payment_request'
    | 'complaint';
  message: string;
  timestamp: string;
  icon: string;
}

export interface QuickAction {
  label: string;
  count: number;
  color: string;
  href: string;
}

/* ────────────────────────────────────────────
   Users
   ──────────────────────────────────────────── */

export type UserStatus = 'active' | 'blocked' | 'unverified';

export interface AdminManagedUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: UserStatus;
  bookingsCount: number;
  totalSpent: number;
  bonusBalance: number;
  lastLogin: string;
  createdAt: string;
}

export interface UserBookingHistory {
  id: string;
  serviceType: 'hotel' | 'bus';
  serviceName: string;
  date: string;
  amount: number;
  status: BookingStatus;
}

export interface UserPayment {
  id: string;
  method: 'click' | 'payme' | 'uzcard' | 'humo';
  amount: number;
  date: string;
  type: 'payment' | 'refund';
}

/* ────────────────────────────────────────────
   Partners
   ──────────────────────────────────────────── */

export type PartnerType =
  | 'hotel'
  | 'bus'
  | 'hostel'
  | 'guesthouse'
  | 'motel'
  | 'dacha'
  | 'restaurant';
export type PartnerRequestStatus =
  | 'new'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'submitted';
export type PartnerStatus =
  | 'active'
  | 'suspended'
  | 'blocked'
  | 'reviewing'
  | 'rejected';

export interface Partner {
  id: string;
  companyName: string;
  type: PartnerType;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  commissionPercent: number;
  rating: number;
  totalBookings: number;
  totalRevenue: number;
  status: PartnerStatus;
  bankName?: string;
  bankAccount?: string;
  bankMfo?: string;
  createdAt: string;
}

export interface PartnerRequest {
  id: string;
  companyName: string;
  type: PartnerType;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  documents: PartnerDocument[];
  note?: string;
  status: PartnerRequestStatus;
  adminNote?: string;
  createdAt: string;
}

export interface PartnerDocument {
  name: string;
  type: 'license' | 'tax_certificate' | 'passport';
  url: string;
}

/* ────────────────────────────────────────────
   Bookings (Admin view)
   ──────────────────────────────────────────── */

export type PaymentMethod = 'click' | 'payme' | 'uzcard' | 'humo';

export interface AdminHotelBooking {
  id: string;
  partnerId?: string;
  customerName: string;
  customerPhone: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  amount: number;
  paymentMethod: PaymentMethod;
  commission: number;
  status: BookingStatus;
  city: string;
  createdAt: string;
}

export interface AdminBusBooking {
  id: string;
  partnerId?: string;
  customerName: string;
  customerPhone: string;
  companyName: string;
  route: string;
  departureDate: string;
  departureTime: string;
  seatNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  commission: number;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingStatusHistory {
  status: string;
  timestamp: string;
  note?: string;
}

export interface BookingDetail {
  id: string;
  serviceType: 'hotel' | 'bus';
  status: BookingStatus;
  createdAt: string;

  // Mijoz
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerId: string;

  // Mehmonxona
  hotelName?: string;
  hotelAddress?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;

  // Avtobus
  companyName?: string;
  route?: string;
  departureDate?: string;
  departureTime?: string;
  seatNumber?: string;

  // To'lov
  paymentMethod: PaymentMethod;
  totalAmount: number;
  commission: number;
  partnerAmount: number;
  transactionId: string;
  paidAt: string;

  // Tarix
  statusHistory: BookingStatusHistory[];
}

/* ────────────────────────────────────────────
   Finance
   ──────────────────────────────────────────── */

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  requestDate: string;
  status: WithdrawalStatus;
  bankAccount: string;
}

export interface FinanceReport {
  id: string;
  title: string;
  period: string;
  totalRevenue: number;
  totalCommission: number;
  dateGenerated: string;
}

/* ────────────────────────────────────────────
   CMS
   ──────────────────────────────────────────── */

export interface CmsBanner {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  order: number;
}

export interface CmsArticle {
  id: string;
  title: string;
  type: 'news' | 'offer' | 'page';
  slug: string;
  status: 'published' | 'draft';
  publishedAt: string;
}

/* ────────────────────────────────────────────
   Catalog
   ──────────────────────────────────────────── */

export interface CatalogRegion {
  id: string;
  name: string;
  hotelsCount: number;
  isActive: boolean;
}

export interface CatalogAmenity {
  id: string;
  name: string;
  icon: string;
  type: 'hotel' | 'room';
  isActive: boolean;
}

/* ────────────────────────────────────────────
   Promos
   ──────────────────────────────────────────── */

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  validUntil: string;
  isActive: boolean;
}

/* ────────────────────────────────────────────
   Support
   ──────────────────────────────────────────── */

export type TicketStatus = 'open' | 'in_progress' | 'closed';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  customerName: string;
  customerType: 'user' | 'partner';
  contactName?: string;
  businessName?: string;
  hotelName?: string;
  companyName?: string;
  taxId?: string;
  partnerId?: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  createdAt: string;
}

/* ────────────────────────────────────────────
   Sidebar
   ──────────────────────────────────────────── */

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: SidebarMenuItem[];
}
