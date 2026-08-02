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
import { ACCOMMODATION_TYPE_MAP, BOOKING_STATUS_MAP, PAYMENT_METHOD_MAP } from "@/lib/constants";
import type { AdminHotelBooking } from "@/types/admin";
import { Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { exportToExcel } from "@/lib/export";
import { AdminApi } from "@/lib/api/admin-api";

import { useAdminStore } from "@/lib/store";

const ITEMS_PER_PAGE = 12;

export default function HotelBookingsPage() {
  const router = useRouter();
  const bookings = useAdminStore((s) => s.hotelBookings);
  const setHotelBookings = useAdminStore((s) => s.setHotelBookings);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    AdminApi.getBookings()
      .then((items) => setHotelBookings(items))
      .finally(() => setLoading(false));
  }, [setHotelBookings]);

  const filtered = useMemo(() => {
    let result = bookings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q) ||
          b.hotelName.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((b) => String(b.status) === statusFilter);
    }
    if (paymentFilter) {
      result = result.filter((b) => b.paymentMethod === paymentFilter);
    }
    if (typeFilter) {
      result = result.filter((b) => b.partnerType === typeFilter);
    }
    return result;
  }, [search, statusFilter, paymentFilter, typeFilter, bookings]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const columns: Column<AdminHotelBooking>[] = [
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
      key: "hotelName",
      label: "Turar-joy",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.hotelName}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              {ACCOMMODATION_TYPE_MAP[row.partnerType] ?? row.partnerType}
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{row.roomType} · {row.city}</span>
        </div>
      ),
    },
    {
      key: "checkIn",
      label: "Kirish",
      render: (row) => <span className="text-sm">{formatDate(row.checkIn)}</span>,
    },
    {
      key: "checkOut",
      label: "Chiqish",
      render: (row) => <span className="text-sm">{formatDate(row.checkOut)}</span>,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportToExcel(filtered, "Bronlar")}>
          Eksport
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="w-80">
          <Input
            isSearch
            placeholder="Bron ID, mijoz ismi, telefon yoki mehmonxona..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-44">
          <Select
            placeholder="Barcha turlar"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={[
              { value: "hotel", label: "Mehmonxona" },
              { value: "motel", label: "Motel" },
              { value: "dacha", label: "Dacha" },
              { value: "hostel", label: "Yotoqxona (Hostel)" },
              { value: "guesthouse", label: "Mehmon uyi" },
            ]}
          />
        </div>
        <div className="w-44">
          <Select
            placeholder="Barcha holatlar"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            options={[
              { value: "click", label: "Click" },
              { value: "payme", label: "Payme" },
              { value: "uzcard", label: "Uzcard" },
              { value: "humo", label: "Humo" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginated}
        keyField="id"
        onRowClick={(row) => router.push(`/bookings/${row.id}`)}
        emptyMessage="Bron topilmadi"
      />

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
