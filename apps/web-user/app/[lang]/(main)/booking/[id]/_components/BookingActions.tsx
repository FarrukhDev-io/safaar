"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackBookingCompleted } from "@/lib/services/analytics/tracker";

export function BookingActions({
  locale,
  isConfirmed,
  bookingId,
  totalSum,
  paymentMethod = "online",
  dict,
}: {
  locale: string;
  isConfirmed: boolean;
  bookingId?: string;
  totalSum?: number;
  paymentMethod?: string;
  dict: {
    voucher?: string;
    backHome?: string;
  };
}) {
  useEffect(() => {
    if (isConfirmed && bookingId) {
      trackBookingCompleted({
        bookingId,
        totalSum: totalSum || 0,
        paymentMethod,
      });
    }
  }, [isConfirmed, bookingId, totalSum, paymentMethod]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {isConfirmed && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handlePrint}
          className="gap-2 font-bold"
        >
          <Printer className="h-4 w-4" />
          {dict.voucher || "Vaucherni chop etish"}
        </Button>
      )}

      <Link href={`/${locale}/account/bookings`}>
        <Button variant="secondary" size="lg" className="font-bold">
          Mening bronlarim
        </Button>
      </Link>

      <Link href={`/${locale}`}>
        <Button variant="ghost" size="lg" className="gap-2 font-semibold">
          <ArrowLeft className="h-4 w-4" />
          {dict.backHome || "Bosh sahifaga"}
        </Button>
      </Link>
    </div>
  );
}
