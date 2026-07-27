"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";
import { PARTNER_STATUS_MAP } from "@/lib/constants";
import { Star, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Partner } from "@/types/admin";
import { PartnerTypeDisplay } from "@/components/ui/PartnerTypeDisplay";
import { exportToExcel } from "@/lib/export";

import { useAdminStore } from "@/lib/store";

const ITEMS_PER_PAGE = 12;

export default function PartnersListPage() {
  const router = useRouter();
  const partners = useAdminStore((s) => s.partners);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = partners;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.companyName.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.city.toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      result = result.filter((p) => p.type === typeFilter);
    }
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result;
  }, [search, typeFilter, statusFilter, partners]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const columns: Column<Partner>[] = [
    {
      key: "id",
      label: "#",
      className: "w-20",
      render: (row) => <span className="text-xs font-mono text-[var(--text-muted)]">{row.id}</span>,
    },
    {
      key: "companyName",
      label: "Kompaniya",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--text-primary)]">{row.companyName}</span>
          <span className="text-xs text-[var(--text-muted)]">{row.contactPerson}</span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Turi",
      render: (row) => (
        <PartnerTypeDisplay type={row.type} />
      ),
    },
    {
      key: "city",
      label: "Shahar",
      render: (row) => <span className="text-sm text-[var(--text-secondary)]">{row.city}</span>,
    },
    {
      key: "totalBookings",
      label: "Bronlar",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center justify-center w-10 h-6 rounded-md bg-[var(--bg-tertiary)] text-xs font-semibold">
          {row.totalBookings}
        </span>
      ),
    },
    {
      key: "totalRevenue",
      label: "Daromad",
      render: (row) => <span className="text-sm font-medium">{formatPrice(row.totalRevenue)}</span>,
    },
    {
      key: "rating",
      label: "Reyting",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium">
          <Star size={14} className="text-[var(--warning)] fill-[var(--warning)]" />
          {row.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Holat",
      render: (row) => <StatusBadge status={row.status} statusMap={PARTNER_STATUS_MAP} />,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportToExcel(filtered, "Hamkorlar")}>
          Eksport
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="w-72">
          <Input
            isSearch
            placeholder="Kompaniya, telefon yoki shahar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-40">
          <Select
            placeholder="Barcha turlar"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={[
              { value: "hotel", label: "Mehmonxona" },
              { value: "hostel", label: "Yotoqxona (Hostel)" },
              { value: "guesthouse", label: "Mehmon uyi" },
              { value: "motel", label: "Motel" },
              { value: "dacha", label: "Dacha" },
              { value: "restaurant", label: "Restoran" },
              { value: "bus", label: "Avtobus" },
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            placeholder="Barcha holatlar"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: "active", label: "Faol" },
              { value: "suspended", label: "To'xtatilgan" },
              { value: "blocked", label: "Bloklangan" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginated}
        keyField="id"
        onRowClick={(row) => router.push(`/partners/${row.id}`)}
        emptyMessage="Hamkor topilmadi"
      />

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
