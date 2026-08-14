"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAdminStore } from "@/lib/store";
import { AdminApi } from "@/lib/api/admin-api";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";
import { BOOKING_STATUS_MAP, PAYMENT_METHOD_MAP } from "@/lib/constants";
import {
  ArrowLeft, Ban, DollarSign, Phone, Mail, Printer, MessageSquare,
  Hotel, Bus, UtensilsCrossed, User, CreditCard, Clock, CheckCircle,
} from "lucide-react";

import { toast } from "sonner";
import { BookingStatus } from "@safaar/types";
import type { BookingDetail } from "@/types/admin";

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const bookingNotes = useAdminStore((s) => s.bookingNotes);
  const setBookingNote = useAdminStore((s) => s.setBookingNote);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState(bookingNotes[id] ?? "");

  useEffect(() => {
    AdminApi.getBookingDetail(id)
      .then((item) => setBooking(item))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg text-[var(--text-muted)]">Bron topilmadi</p>
        <Link href="/bookings/hotels" className="text-sm text-[var(--primary)] hover:underline">
          ← Bronlar ro&apos;yxatiga qaytish
        </Link>
      </div>
    );
  }

  const isHotel = booking.serviceType === "hotel";
  const isRestaurant = booking.serviceType === "restaurant";

  const [isRefunding, setIsRefunding] = useState(false);

  const handleCancel = async () => {
    if (confirm("Rostdan ham ushbu bronni bekor qilmoqchimisiz?")) {
      const updated = await AdminApi.cancelBooking(id);
      setBooking(updated);
      toast.success("Bron bekor qilindi!");
    }
  };

  const handleRefund = async () => {
    if (!confirm(`${formatPrice(booking.totalAmount)} miqdorida to'lovni qaytarmoqchimisiz?`)) return;

    setIsRefunding(true);
    try {
      const refunds = await AdminApi.getRefunds();
      const refund = refunds.find((r) => r.bookingId === booking.id);

      if (!refund) {
        toast.error("Bu bron uchun refund so'rovi mavjud emas. Mijoz avval bekor qilishi kerak.");
        return;
      }

      if (refund.status === 'approved' || refund.status === 'completed') {
        toast.error("Ushbu bron uchun to'lov allaqachon qaytarilgan.");
        return;
      }

      await AdminApi.refundAction(refund.id, 'approve');
      toast.success("To'lov muvaffaqiyatli qaytarildi (refund tasdiqlandi)!");

      // Refresh booking detail
      const updated = await AdminApi.getBookingDetail(id);
      setBooking(updated);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "To'lovni qaytarishda xatolik yuz berdi");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link
        href={isHotel ? "/bookings/hotels" : isRestaurant ? "/bookings/restaurants" : "/bookings/buses"}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Bronlar ro&apos;yxatiga qaytish
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
            style={{
              background: isHotel
                ? "linear-gradient(135deg, #1E3A5F, #2B5278)"
                : isRestaurant
                  ? "linear-gradient(135deg, #B8860B, #D4A017)"
                  : "linear-gradient(135deg, #2ECC71, #25A85C)",
            }}
          >
            {isHotel ? <Hotel size={24} /> : isRestaurant ? <UtensilsCrossed size={24} /> : <Bus size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Bron {booking.id}</h1>
              <StatusBadge status={String(booking.status)} statusMap={BOOKING_STATUS_MAP} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {isHotel ? "Mehmonxona bron" : isRestaurant ? "Restoran bron" : "Ijara bron"} · Yaratilgan: {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {booking.status !== BookingStatus.CANCELLED && (
            <Button variant="danger" size="sm" icon={<Ban size={14} />} onClick={handleCancel}>
              Bekor qilish
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<DollarSign size={14} />} onClick={handleRefund} disabled={isRefunding}>
            {isRefunding ? "Kuting..." : "Refund"}
          </Button>
          <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>Chop etish</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Customer info */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-[var(--primary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Mijoz ma&apos;lumotlari</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Ism familiya</p>
                <p className="text-sm font-medium">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Telefon</p>
                <p className="text-sm font-medium">{booking.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Email</p>
                <p className="text-sm font-medium">{booking.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Foydalanuvchi ID</p>
                <Link href={`/users/${booking.customerId}`} className="text-sm font-medium text-[var(--primary)] hover:underline">
                  {booking.customerId}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
              <a href={`tel:${booking.customerPhone}`}>
                <Button variant="ghost" size="sm" icon={<Phone size={14} />}>Qo&apos;ng&apos;iroq</Button>
              </a>
              <a href={`mailto:${booking.customerEmail}`}>
                <Button variant="ghost" size="sm" icon={<Mail size={14} />}>Email</Button>
              </a>
            </div>
          </Card>

          {/* Service info */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              {isHotel ? <Hotel size={18} className="text-[var(--primary)]" /> : isRestaurant ? <UtensilsCrossed size={18} className="text-[var(--accent)]" /> : <Bus size={18} className="text-[var(--accent)]" />}
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {isHotel ? "Mehmonxona ma'lumotlari" : isRestaurant ? "Restoran ma'lumotlari" : "Mashina ma'lumotlari"}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {isHotel ? (
                <>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Mehmonxona</p>
                    <p className="text-sm font-medium">{booking.hotelName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Manzil</p>
                    <p className="text-sm font-medium">{booking.hotelAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Xona turi</p>
                    <p className="text-sm font-medium">{booking.roomType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Mehmonlar</p>
                    <p className="text-sm font-medium">{booking.guests} kishi</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Kirish sanasi</p>
                    <p className="text-sm font-medium">{formatDate(booking.checkIn!)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Chiqish sanasi</p>
                    <p className="text-sm font-medium">{formatDate(booking.checkOut!)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Tunlar soni</p>
                    <p className="text-sm font-medium">{booking.nights} tun</p>
                  </div>
                </>
              ) : isRestaurant ? (
                <>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Restoran</p>
                    <p className="text-sm font-medium">{booking.hotelName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Manzil</p>
                    <p className="text-sm font-medium">{booking.hotelAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Stol turi</p>
                    <p className="text-sm font-medium">{booking.roomType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Kishilar soni</p>
                    <p className="text-sm font-medium">{booking.guests} kishi</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Sana</p>
                    <p className="text-sm font-medium">{formatDate(booking.checkIn!)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Vaqt</p>
                    <p className="text-sm font-medium">{booking.slotTime}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Kompaniya</p>
                    <p className="text-sm font-medium">{booking.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Marshrut</p>
                    <p className="text-sm font-medium">{booking.route}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Jo&apos;nash sanasi</p>
                    <p className="text-sm font-medium">{formatDate(booking.departureDate!)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Vaqt</p>
                    <p className="text-sm font-medium">{booking.departureTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">O&apos;rindiq</p>
                    <p className="text-sm font-medium">#{booking.seatNumber}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Payment info */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-[var(--primary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">To&apos;lov</h3>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Umumiy summa</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{formatPrice(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Komissiya</span>
                <span className="text-sm font-medium text-[var(--accent)]">{formatPrice(booking.commission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Hamkorga</span>
                <span className="text-sm font-medium">{formatPrice(booking.partnerAmount)}</span>
              </div>
              <hr className="border-[var(--border)]" />
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">To&apos;lov usuli</span>
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--bg-tertiary)]">
                  {PAYMENT_METHOD_MAP[booking.paymentMethod] ?? booking.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Tranzaksiya ID</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{booking.transactionId.slice(0, 20)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">To&apos;lov vaqti</span>
                <span className="text-sm">{formatDateTime(booking.paidAt)}</span>
              </div>
            </div>
          </Card>

          {/* Status history */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-[var(--primary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Holat tarixi</h3>
            </div>
            <div className="flex flex-col gap-0">
              {booking.statusHistory.map((item, i) => (
                <div key={i} className="flex gap-3 relative">
                  {/* Timeline line */}
                  {i < booking.statusHistory.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-[var(--border)]" />
                  )}
                  {/* Dot */}
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0 z-10">
                    <CheckCircle size={14} className="text-[var(--accent)]" />
                  </div>
                  {/* Content */}
                  <div className="pb-4">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.status}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDateTime(item.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Internal note */}
          <Card padding="md">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-[var(--text-muted)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Ichki izoh</p>
              </div>
              {noteDraft !== (bookingNotes[id] ?? "") && (
                <Button
                  size="sm"
                  onClick={() => {
                    setBookingNote(id, noteDraft);
                    toast.success("Izoh saqlandi");
                  }}
                >
                  Saqlash
                </Button>
              )}
            </div>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Izoh yozing..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none h-20"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
