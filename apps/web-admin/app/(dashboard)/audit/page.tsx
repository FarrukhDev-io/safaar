"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { AdminApi } from "@/lib/api/admin-api";
import { formatDateTime } from "@/lib/utils";

interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  date: string;
  ip: string;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminApi.getAuditLogs()
      .then((items) => setLogs(items))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [log.user, log.action, log.target, log.ip]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [logs, search]);

  const columns = [
    { key: "user", label: "Foydalanuvchi" },
    { key: "action", label: "Harakat" },
    { key: "target", label: "Obyekt" },
    { key: "ip", label: "IP Manzil", render: (row: AuditLog) => <span className="font-mono text-xs">{row.ip}</span> },
    { key: "date", label: "Sana", render: (row: AuditLog) => formatDateTime(row.date) },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Tizimdagi barcha admin va moderatorlarning xatti-harakatlari jurnali (Audit Trail)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="#F39C12" bg="rgba(243,156,18,0.12)" className="flex items-center gap-1">
            <History size={14} /> Xavfsizlik jurnali
          </Badge>
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <div className="relative w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Foydalanuvchi yoki harakat bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={filteredLogs}
            keyField="id"
            emptyMessage="Audit loglar topilmadi"
          />
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <Pagination
            currentPage={page}
            totalPages={1}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
