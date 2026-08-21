"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Utensils,
  CreditCard,
  Banknote,
  X,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { formatSum } from "@/lib/money";
import type { RestaurantDetailView } from "@safaar/api-client";
import { Button } from "@/components/ui/Button";

export function RestaurantBookingSection({
  restaurant,
}: {
  restaurant: RestaurantDetailView;
}) {
  const [selectedTableId, setSelectedTableId] = useState<string>(
    restaurant.tables[0]?.id ?? ""
  );
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [slotTime, setSlotTime] = useState<string>(
    restaurant.checkInTime || "18:00"
  );
  const [guests, setGuests] = useState<number>(2);
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");

  const [loading, setLoading] = useState<boolean>(false);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [onlinePaymentUnavailable, setOnlinePaymentUnavailable] = useState<boolean>(false);

  const selectedTable = restaurant.tables.find((t) => t.id === selectedTableId);
  const totalAmount = selectedTable?.basePriceSum ?? 0;

  const handleOpenModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      setErrorMsg("Iltimos, ismingiz va telefon raqamingizni kiriting");
      return;
    }
    setErrorMsg(null);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setOnlinePaymentUnavailable(false);
    setLoading(true);

    try {
      const { api } = await import("@/lib/api");
      const booking = await api.bookings.createHotelBooking({
        hotelId: restaurant.id,
        roomId: selectedTableId || restaurant.id,
        checkIn: date,
        checkOut: date,
        slotTime: slotTime,
        guests: guests,
        totalPrice: totalAmount,
        guestName,
        guestPhone,
        guestEmail,
        source: "web-user",
        paymentMethod: paymentMethod === "online" ? "click" : "cash",
      });

      if (paymentMethod === "cash") {
        const bookingId = booking.bookingNumber || booking.id || "CONFIRMED";
        setSuccessBookingId(bookingId);
        setShowPaymentModal(false);
        return;
      }

      // Onlayn to'lov — karta ma'lumotlari hech qachon bizning
      // serverimizga yuborilmaydi (PCI). Mijoz Click'ning o'z xavfsiz
      // to'lov sahifasiga yo'naltiriladi, karta raqamini o'sha yerda kiritadi.
      const resolveCheckoutUrl = async (): Promise<string> => {
        if (booking.payment?.url) return booking.payment.url;
        try {
          const session = await api.payments.createPaymentSession(booking.id, "click");
          return session.paymentUrl ?? "";
        } catch {
          return "";
        }
      };
      const checkoutUrl = await resolveCheckoutUrl();

      if (checkoutUrl) {
        // Real browser navigation to Click's hosted checkout — not a React
        // state mutation, safe outside the compiler's render-purity checks.
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = checkoutUrl;
        return;
      }

      setOnlinePaymentUnavailable(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (successBookingId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-md dark:border-emerald-800 dark:bg-emerald-950/40">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-3 text-xl font-extrabold text-emerald-900 dark:text-emerald-200">
          Stol band qilindi!
        </h3>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
          Bron ID: <span className="font-mono font-bold">{successBookingId}</span>
        </p>
        <div className="mt-4 rounded-xl bg-emerald-100/60 p-3 text-left text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
          <p><strong>Restoran:</strong> {restaurant.name}</p>
          <p><strong>Stol:</strong> {selectedTable?.name ?? "Tanlangan stol"}</p>
          <p><strong>Sana va vaqt:</strong> {date} ({slotTime})</p>
          <p><strong>Mijoz:</strong> {guestName} ({guestPhone})</p>
          <p><strong>To'lov usuli:</strong> Naqd pul (joyida)</p>
        </div>
        <Button
          onClick={() => setSuccessBookingId(null)}
          variant="secondary"
          className="mt-6 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
        >
          Yangi bron qilish
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        id="booking-section"
        className="scroll-mt-24 rounded-2xl border border-slate-200 bg-card p-6 shadow-md dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <Utensils className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Stol bron qilish
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Kechki ovqat yoki tushlik uchun stolni oldindan band qiling
        </p>

        {errorMsg && !showPaymentModal && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleOpenModal} className="mt-5 space-y-4">
          {/* Table Selection */}
          {restaurant.tables.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Stolni tanlang
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {restaurant.tables.map((tbl) => (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => setSelectedTableId(tbl.id)}
                    className={`flex flex-col rounded-xl border p-2.5 text-left text-xs transition-all ${
                      selectedTableId === tbl.id
                        ? "border-primary-600 bg-primary-50 ring-2 ring-primary-500 dark:border-primary-500 dark:bg-primary-950/50"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-bold text-slate-900 dark:text-white">
                      {tbl.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tbl.capacity} kishilik
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Calendar className="mr-1 inline-block h-3.5 w-3.5" /> Sana
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Clock className="mr-1 inline-block h-3.5 w-3.5" /> Kelish vaqti
              </label>
              <input
                type="time"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Guests Count */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kishilar soni
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ismingiz *
              </label>
              <input
                type="text"
                placeholder="Masalan: Ali Valiyev"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Telefon raqamingiz *
              </label>
              <input
                type="tel"
                placeholder="+998 90 123 45 67"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email (ixtiyoriy)
              </label>
              <input
                type="email"
                placeholder="ali@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-600 font-extrabold text-white hover:bg-primary-700 py-3"
          >
            Stolni bron qilish
          </Button>
        </form>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              To'lovni amalga oshirish
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {restaurant.name} · {selectedTable?.name ?? "Stol bron qilish"}
            </p>

            {errorMsg && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {onlinePaymentUnavailable && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Onlayn to&apos;lov hozircha mavjud emas. Iltimos, &quot;Naqd (Joyida)&quot; usulini tanlang.</span>
              </div>
            )}

            {/* Order Summary box */}
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs dark:bg-slate-800/60">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Sana & Vaqt:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {date} ({slotTime})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Mijoz:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {guestName} ({guestPhone})
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2 text-sm font-bold dark:border-slate-700">
                <span className="text-slate-900 dark:text-white">Jami summa:</span>
                <span className="text-primary-600 dark:text-primary-400">
                  {totalAmount > 0 ? formatSum(totalAmount) : "Bepul (Stol band etish)"}
                </span>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="mt-4 space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  To'lov usuli
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("online");
                      setOnlinePaymentUnavailable(false);
                    }}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                      paymentMethod === "online"
                        ? "border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500 dark:border-primary-500 dark:bg-primary-950/50 dark:text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                    Onlayn (Click)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cash");
                      setOnlinePaymentUnavailable(false);
                    }}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                      paymentMethod === "cash"
                        ? "border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500 dark:border-primary-500 dark:bg-primary-950/50 dark:text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Banknote className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    Naqd (Joyida)
                  </button>
                </div>
              </div>

              {paymentMethod === "online" && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  Karta ma&apos;lumotlarini Click&apos;ning o&apos;z xavfsiz to&apos;lov sahifasida kiritasiz — bu yerda saqlanmaydi.
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                  Stol band qilinadi. To'lov restoranga yetib kelganingizda amalga oshiriladi.
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 font-extrabold text-white hover:bg-primary-700 py-3 shadow-md"
              >
                {loading
                  ? "Yo'naltirilmoqda..."
                  : paymentMethod === "online"
                  ? `Click orqali to'lash ${totalAmount > 0 ? `(${formatSum(totalAmount)})` : ""}`
                  : "Bronni tasdiqlash (Naqd)"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
