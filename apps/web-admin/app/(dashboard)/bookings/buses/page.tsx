"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { formatDate, formatPrice } from "@/lib/utils";
import { BOOKING_STATUS_MAP, PAYMENT_METHOD_MAP } from "@/lib/constants";
import type { AdminBusBooking } from "@/types/admin";
import { Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { exportToExcel } from "@/lib/export";
import { AdminApi } from "@/lib/api/admin-api";
import { useAdminStore } from "@/lib/store";

const ITEMS_PER_PAGE = 12;

export default function BusBookingsPage() {
  const router = useRouter();
  const bookings = useAdminStore((s) => s.busBookings);
  const setBusBookings = useAdminStore((s) => s.setBusBookings);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    AdminApi.getBusBookings()
      .then((items) => setBusBookings(items))
      .finally(() => setLoading(false));
  }, [setBusBookings]);

  const filtered = useMemo(() => {
    let result = bookings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (booking) =>
          booking.id.toLowerCase().includes(q) ||
          booking.customerName.toLowerCase().includes(q) ||
          booking.customerPhone.includes(q) ||
          booking.companyName.toLowerCase().includes(q) ||
          booking.route.toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      result = result.filter((booking) => String(booking.status) === statusFilter);
    }
    if (paymentFilter) {
      result = result.filter((booking) => booking.paymentMethod === paymentFilter);
    }
    return result;
  }, [bookings, paymentFilter, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const columns: Column<AdminBusBooking>[] = [
    {
      key: "id",
      label: "Bron ID",
      className: "w-24",
      render: (row) => <span className="font-mono text-xs text-[var(--primary)] font-medium">{row.id}</span>,
    },
    {
      key: "customerName",
      label: "Mijoz",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--text-primary)]">{row.customerName}</span>
          <span className="text-xs text-[var(--text-muted)]">{row.customerPhone}</span>
        </div>
      ),
    },
    {
      key: "companyName",
      label: "Kompaniya",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.companyName}</span>
          <span className="text-xs text-[var(--text-muted)]">{row.route}</span>
        </div>
      ),
    },
    {
      key: "departureDate",
      label: "Jo'nash",
      render: (row) => <span className="text-sm">{formatDate(row.departureDate)} {row.departureTime}</span>,
    },
    {
      key: "seatNumber",
      label: "O'rindiq",
      render: (row) => <span className="text-sm font-medium">#{row.seatNumber}</span>,
    },
    {
      key: "amount",
      label: "Summa",
      render: (row) => <span className="text-sm font-medium">{formatPrice(row.amount)}</span>,
    },
    {
      key: "paymentMethod",
      label: "To'lov",
      render: (row) => (
        <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--bg-tertiary)]">
          {PAYMENT_METHOD_MAP[row.paymentMethod] ?? row.paymentMethod}
        </span>
      ),
    },
    {
      key: "status",
      label: "Holat",
      render: (row) => <StatusBadge status={String(row.status)} statusMap={BOOKING_STATUS_MAP} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportToExcel(filtered, "Ijara_bronlari")}>
          Eksport
        </Button>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <div className="w-80">
          <Input
            isSearch
            placeholder="Bron ID, mijoz, telefon, kompaniya yoki yo'nalish..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </div>
        <div className="w-44">
          <Select
            placeholder="Barcha holatlar"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
            options={[
              { value: "PENDING", label: "Kutilmoqda" },
              { value: "CONFIRMED", label: "Tasdiqlangan" },
              { value: "CANCELLED", label: "Bekor qilingan" },
              { value: "COMPLETED", label: "Yakunlangan" },
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            placeholder="To'lov usuli"
            value={paymentFilter}
            onChange={(event) => { setPaymentFilter(event.target.value); setPage(1); }}
            options={[
              { value: "click", label: "Click" },
              { value: "payme", label: "Payme" },
              { value: "uzcard", label: "Uzcard" },
              { value: "humo", label: "Humo" },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        keyField="id"
        onRowClick={(row) => router.push(`/bookings/${row.id}`)}
        emptyMessage="Ijara bronlari topilmadi"
      />

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
