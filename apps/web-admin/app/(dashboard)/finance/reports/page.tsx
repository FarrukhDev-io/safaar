"use client";

import { useState, useEffect } from "react";
import { MockApi } from "@/lib/api/mock-api";
import type { FinanceReport } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { formatDate, formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Download } from "lucide-react";
import { exportToExcel } from "@/lib/export";

export default function FinanceReportsPage() {
  const [data, setData] = useState<FinanceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockApi.getFinanceReports().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const columns: Column<FinanceReport>[] = [
    { key: "id", label: "ID", render: (row) => <span className="text-xs font-mono">{row.id}</span> },
    { key: "title", label: "Hisobot nomi", render: (row) => <span className="font-medium">{row.title}</span> },
    { key: "period", label: "Davr", render: (row) => <span className="text-sm">{row.period}</span> },
    { key: "totalRevenue", label: "Umumiy Daromad", render: (row) => <span className="font-medium text-[var(--text-primary)]">{formatPrice(row.totalRevenue)}</span> },
    { key: "totalCommission", label: "Sof Komissiya", render: (row) => <span className="font-medium text-[var(--success)]">{formatPrice(row.totalCommission)}</span> },
    { key: "dateGenerated", label: "Yaratilgan sana", render: (row) => <span className="text-sm">{formatDate(row.dateGenerated)}</span> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => exportToExcel([row], row.title)}
          >
            Yuklash
          </Button>
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
      

      <DataTable
        columns={columns}
        data={data}
        keyField="id"
        emptyMessage="Hisobotlar topilmadi"
      />
    </div>
  );
}
