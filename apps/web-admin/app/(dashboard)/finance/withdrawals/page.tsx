"use client";

import { useState, useEffect } from "react";
import { AdminApi } from "@/lib/api/admin-api";
import type { WithdrawalRequest } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Check, X, Download, CheckCircle2 } from "lucide-react";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

const STATUS_MAP = {
  pending: { label: "Kutilmoqda", color: "var(--warning)", bg: "rgba(243, 156, 18, 0.1)" },
  approved: { label: "Tasdiqlangan", color: "var(--success)", bg: "rgba(46, 204, 113, 0.1)" },
  rejected: { label: "Rad etilgan", color: "var(--danger)", bg: "rgba(231, 76, 60, 0.1)" },
  paid: { label: "To'landi", color: "#3498DB", bg: "rgba(52, 152, 219, 0.1)" },
};

export default function WithdrawalsPage() {
  const [data, setData] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminApi.getWithdrawals().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Rostdan ham ushbu to'lov so'rovini tasdiqlamoqchimisiz?")) return;
    const updated = await AdminApi.approveWithdrawal(id);
    setData((prev) => prev.map((d) => d.id === id ? updated : d));
    toast.success("To'lov so'rovi tasdiqlandi!");
  };

  const handleReject = async (id: string) => {
    if (!confirm("Rostdan ham ushbu to'lov so'rovini rad etmoqchimisiz?")) return;
    const updated = await AdminApi.rejectWithdrawal(id);
    setData((prev) => prev.map((d) => d.id === id ? updated : d));
    toast.success("To'lov so'rovi rad etildi!");
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Rostdan ham ushbu to'lov so'rovini 'To'landi' deb belgilaysizmi?")) return;
    const updated = await AdminApi.markWithdrawalPaid(id);
    setData((prev) => prev.map((d) => d.id === id ? updated : d));
    toast.success("So'rov 'To'landi' deb belgilandi!");
  };

  const columns: Column<WithdrawalRequest>[] = [
    { key: "id", label: "ID", render: (row) => <span className="text-xs font-mono">{row.id}</span> },
    { key: "partnerName", label: "Hamkor" },
    { key: "amount", label: "Summa", render: (row) => <span className="font-medium">{formatPrice(row.amount)}</span> },
    { key: "requestDate", label: "Sana", render: (row) => <span className="text-sm">{formatDate(row.requestDate)}</span> },
    { key: "bankAccount", label: "Hisob raqam", render: (row) => <span className="font-mono text-xs">{row.bankAccount}</span> },
    { key: "status", label: "Holat", render: (row) => <StatusBadge status={row.status} statusMap={STATUS_MAP as any} /> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "pending" && (
            <>
              <button onClick={() => handleApprove(row.id)} title="Tasdiqlash" className="w-8 h-8 rounded flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10">
                <Check size={16} />
              </button>
              <button onClick={() => handleReject(row.id)} title="Rad etish" className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10">
                <X size={16} />
              </button>
            </>
          )}
          {row.status === "approved" && (
            <button onClick={() => handleMarkPaid(row.id)} title="To'landi" className="h-8 px-3 rounded flex items-center gap-1.5 justify-center text-blue-600 hover:bg-blue-50 text-xs font-medium border border-blue-200">
              <CheckCircle2 size={14} /> To'landi
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pul yechishlar</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Hamkorlarning pul yechish so'rovlarini boshqarish va to'landi belgisini qo'yish
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => exportToExcel(data, "Pul_yechish")}>
          Eksport
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        keyField="id"
        emptyMessage="To'lov so'rovlari topilmadi"
      />
    </div>
  );
}
