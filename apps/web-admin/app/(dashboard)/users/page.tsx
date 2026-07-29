"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import { formatDate, formatPrice } from "@/lib/utils";
import { USER_STATUS_MAP } from "@/lib/constants";
import { Download, Mail } from "lucide-react";
import type { AdminManagedUser } from "@/types/admin";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

import { useAdminStore } from "@/lib/store";

const ITEMS_PER_PAGE = 12;

export default function UsersPage() {
  const router = useRouter();
  const users = useAdminStore((s) => s.users);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((u) => u.status === statusFilter);
    }
    return result;
  }, [search, statusFilter, users]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const columns: Column<AdminManagedUser>[] = [
    {
      key: "id",
      label: "#",
      className: "w-20",
      render: (row) => (
        <span className="text-xs font-mono text-[var(--text-muted)]">{row.id}</span>
      ),
    },
    {
      key: "fullName",
      label: "Ism Familiya",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--text-primary)]">{row.fullName}</span>
          <span className="text-xs text-[var(--text-muted)]">{row.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Telefon",
      render: (row) => <span className="text-sm">{row.phone}</span>,
    },
    {
      key: "createdAt",
      label: "Ro'yxat sanasi",
      render: (row) => <span className="text-sm text-[var(--text-secondary)]">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "bookingsCount",
      label: "Bronlar",
      className: "text-center",
      render: (row) => (
        <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-[var(--bg-tertiary)] text-xs font-semibold">
          {row.bookingsCount}
        </span>
      ),
    },
    {
      key: "totalSpent",
      label: "Sarflagan",
      render: (row) => (
        <span className="text-sm font-medium">{formatPrice(row.totalSpent)}</span>
      ),
    },
    {
      key: "status",
      label: "Holat",
      render: (row) => <StatusBadge status={row.status} statusMap={USER_STATUS_MAP} />,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportToExcel(filtered, "Foydalanuvchilar")}>
            Eksport
          </Button>
          <Button variant="secondary" size="sm" icon={<Mail size={14} />} onClick={() => setSmsModalOpen(true)}>
            SMS yuborish
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div className="w-72">
          <Input
            isSearch
            placeholder="Ism, telefon yoki email bo'yicha qidirish..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-44">
          <Select
            placeholder="Barcha holatlar"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: "active", label: "Faol" },
              { value: "blocked", label: "Bloklangan" },
              { value: "unverified", label: "Tasdiqlanmagan" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginated}
        keyField="id"
        onRowClick={(row) => router.push(`/users/${row.id}`)}
        emptyMessage="Foydalanuvchi topilmadi"
      />

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        open={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        title="Ommaviy SMS yuborish"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSmsModalOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={() => {
                if (!smsMessage.trim()) {
                  toast.error("Xabar matnini kiriting");
                  return;
                }
                toast.success(`${filtered.length} ta foydalanuvchiga SMS yuborildi`);
                setSmsMessage("");
                setSmsModalOpen(false);
              }}
            >
              Yuborish
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Joriy filtrga mos {filtered.length} ta foydalanuvchiga yuboriladi.
          </p>
          <textarea
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            placeholder="Xabar matnini kiriting..."
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none resize-none"
          />
        </div>
      </Modal>
    </div>
  );
}
