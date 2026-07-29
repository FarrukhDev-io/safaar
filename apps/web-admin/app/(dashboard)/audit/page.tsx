"use client";

import { useState } from "react";
import { History, Search } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/utils";

// Qattiq yozilgan (statik) sanalar — `new Date()`/`Date.now()` ishlatilmaydi,
// chunki server va klient bu kodni turli lahzalarda bajaradi va natijada
// bir xil bo'lmagan vaqt qiymatlari React hydration mismatchiga olib kelardi.
const mockLogs = [
  { id: "1", user: "Super Admin", action: "Partnerni tasdiqlash", target: "Hilton Hotel", date: "2026-07-29T10:00:00.000Z", ip: "192.168.1.100" },
  { id: "2", user: "Moderator Ali", action: "Foydalanuvchini bloklash", target: "User #12345", date: "2026-07-29T09:00:00.000Z", ip: "10.0.0.15" },
  { id: "3", user: "Moliya Admini", action: "Komissiya o'zgartirildi", target: "Global Sozlamalar", date: "2026-07-29T08:00:00.000Z", ip: "192.168.1.102" },
  { id: "4", user: "Super Admin", action: "Tizimga kirish", target: "Auth", date: "2026-07-28T10:00:00.000Z", ip: "192.168.1.100" },
];

type AuditLog = (typeof mockLogs)[number];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredLogs = mockLogs.filter((log) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [log.user, log.action, log.target].join(" ").toLowerCase().includes(q);
  });

  const columns = [
    { key: "user", label: "Foydalanuvchi" },
    { key: "action", label: "Harakat" },
    { key: "target", label: "Obyekt" },
    { key: "ip", label: "IP Manzil", render: (row: AuditLog) => <span className="font-mono text-xs">{row.ip}</span> },
    { key: "date", label: "Sana", render: (row: AuditLog) => formatDateTime(row.date) },
  ];

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
            emptyMessage="Qidiruv bo'yicha hech narsa topilmadi"
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
