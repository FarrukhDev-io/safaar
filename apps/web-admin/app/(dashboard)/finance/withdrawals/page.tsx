"use client";

import { useState, useEffect } from "react";
import { AdminApi } from "@/lib/api/admin-api";
import type { WithdrawalRequest } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Check, X, Download } from "lucide-react";
import { exportToExcel } from "@/lib/export";

const STATUS_MAP = {
  pending: { label: "Kutilmoqda", color: "var(--warning)", bg: "rgba(243, 156, 18, 0.1)" },
  approved: { label: "Tasdiqlangan", color: "var(--success)", bg: "rgba(46, 204, 113, 0.1)" },
  rejected: { label: "Rad etilgan", color: "var(--danger)", bg: "rgba(231, 76, 60, 0.1)" },
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
    const updated = await AdminApi.approveWithdrawal(id);
    setData((prev) => prev.map((d) => d.id === id ? updated : d));
  };

  const handleReject = async (id: string) => {
    const updated = await AdminApi.rejectWithdrawal(id);
    setData((prev) => prev.map((d) => d.id === id ? updated : d));
  };

  const columns: Column<WithdrawalRequest>[] = [
    { key: "id", label: "ID", render: (row) => <span className="text-xs font-mono">{row.id}</span> },
    { key: "partnerName", label: "Hamkor" },
    { key: "amount", label: "Summa", render: (row) => <span className="font-medium">{formatPrice(row.amount)}</span> },
    { key: "requestDate", label: "Sana", render: (row) => <span className="text-sm">{formatDate(row.requestDate)}</span> },
    { key: "bankAccount", label: "Hisob raqam", render: (row) => <span className="font-mono text-xs">{row.bankAccount}</span> },
    { key: "status", label: "Holat", render: (row) => <StatusBadge status={row.status} statusMap={STATUS_MAP} /> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "pending" && (
            <>
              <button onClick={() => handleApprove(row.id)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10">
                <Check size={16} />
              </button>
              <button onClick={() => handleReject(row.id)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10">
                <X size={16} />
              </button>
            </>
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
