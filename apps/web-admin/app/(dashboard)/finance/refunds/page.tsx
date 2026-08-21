"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, History, CheckCircle2, XCircle, RefreshCw, MoreVertical } from "lucide-react";
import Button from "@/components/ui/Button";
import { AdminApi } from "@/lib/api/admin-api";
import { AdminRefundTransaction } from "@/types/admin";
import { cn, formatPrice } from "@/lib/utils";

const STATUS_COLORS = {
  requested: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  paid: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  requested: "Kutilmoqda",
  processing: "Jarayonda",
  approved: "Tasdiqlangan",
  paid: "To'landi",
  rejected: "Rad etilgan",
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<AdminRefundTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRefunds = async () => {
    try {
      const data = await AdminApi.getRefunds();
      setRefunds(data);
    } catch (err) {
      toast.error("Qaytarishlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'retry') => {
    setActionLoading(`${id}-${action}`);
    try {
      await AdminApi.refundAction(id, action);
      toast.success(action === 'approve' ? "Tasdiqlandi" : action === 'reject' ? "Rad etildi" : "Qayta urinish boshlandi");
      fetchRefunds();
    } catch (err: any) {
      toast.error("Amalni bajarib bo'lmadi");
    } finally {
      setActionLoading(null);
      setDropdownOpen(null);
    }
  };

  const filtered = refunds.filter(r => 
    r.customerName.toLowerCase().includes(search.toLowerCase()) || 
    r.bookingId.toLowerCase().includes(search.toLowerCase()) ||
    r.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <History size={24} className="text-[var(--primary)]" />
            Qaytarishlar (Refunds)
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Bekor qilingan bronlar bo'yicha pullarni qaytarish navbati
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Izlash (mijoz, bron ID)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none w-full sm:w-64 transition-all"
            />
          </div>
          <Button onClick={fetchRefunds} variant="secondary" icon={<RefreshCw size={16} />}>
            Yangilash
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-medium">
              <tr>
                <th className="px-6 py-4">Bron ID</th>
                <th className="px-6 py-4">Mijoz</th>
                <th className="px-6 py-4">Summa</th>
                <th className="px-6 py-4">Sabab</th>
                <th className="px-6 py-4">Holat</th>
                <th className="px-6 py-4">Sana</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    <span className="inline-block w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    Hech narsa topilmadi
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {r.bookingId.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                      {r.customerName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-purple-600">
                      {formatPrice(r.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", STATUS_COLORS[r.status] || "bg-slate-100 text-slate-700")}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(r.createdAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === r.id ? null : r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          {actionLoading?.startsWith(r.id) ? (
                            <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          ) : (
                            <MoreVertical size={18} />
                          )}
                        </button>

                        {dropdownOpen === r.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 overflow-hidden">
                              {(r.status === 'requested' || r.status === 'processing') && (
                                <>
                                  <button
                                    onClick={() => handleAction(r.id, 'approve')}
                                    className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors font-medium"
                                  >
                                    <CheckCircle2 size={16} /> Tasdiqlash
                                  </button>
                                  <button
                                    onClick={() => handleAction(r.id, 'reject')}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                                  >
                                    <XCircle size={16} /> Rad etish
                                  </button>
                                </>
                              )}

                              {r.status === 'rejected' && (
                                <button
                                  onClick={() => handleAction(r.id, 'retry')}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors font-medium"
                                >
                                  <RefreshCw size={16} /> Qayta ochish
                                </button>
                              )}

                              {r.status !== 'requested' && r.status !== 'processing' && r.status !== 'rejected' && (
                                <div className="px-4 py-2 text-xs text-slate-400">
                                  Boshqa amal mavjud emas
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
