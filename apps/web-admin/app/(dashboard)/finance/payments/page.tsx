"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, CreditCard, RefreshCw, Eye, MoreVertical } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import { AdminApi } from "@/lib/api/admin-api";
import { AdminPaymentTransaction } from "@/types/admin";
import { cn, formatPrice } from "@/lib/utils";

const PROVIDER_LOGOS: Record<string, string> = {
  click: "/images/providers/click.png", // Assume these might exist or we'll just use text
  payme: "/images/providers/payme.png",
  uzcard: "/images/providers/uzcard.png",
  humo: "/images/providers/humo.png",
};

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const STATUS_LABELS = {
  pending: "Kutilmoqda",
  success: "Muvaffaqiyatli",
  failed: "Xatolik",
  refunded: "Qaytarilgan",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const [error, setError] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await AdminApi.getPayments();
      setPayments(data);
    } catch (err) {
      toast.error("Tranzaksiyalarni yuklab bo'lmadi");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await AdminApi.getPayments();
        if (!cancelled) setPayments(data);
      } catch {
        if (!cancelled) {
          toast.error("Tranzaksiyalarni yuklab bo'lmadi");
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);


  const handleReconcile = async (id: string) => {
    try {
      await AdminApi.reconcilePayment(id);
      toast.success("Tranzaksiya muvofiqlashtirildi");
      fetchPayments();
    } catch (err: any) {
      toast.error("Muvofiqlashtirishda xatolik");
    }
    setDropdownOpen(null);
  };

  const filtered = payments.filter(p => 
    p.customerName.toLowerCase().includes(search.toLowerCase()) || 
    p.bookingId.toLowerCase().includes(search.toLowerCase()) ||
    (p.providerTransactionId && p.providerTransactionId.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<AdminPaymentTransaction>[] = [
    {
      key: "bookingId",
      label: "Bron ID",
      render: (p) => (
        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
          {p.bookingId.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "customerName",
      label: "Mijoz",
      render: (p) => <span className="font-medium text-[var(--text-primary)]">{p.customerName}</span>,
    },
    {
      key: "amount",
      label: "Summa",
      render: (p) => <span className="font-semibold text-[var(--text-primary)]">{formatPrice(p.amount)}</span>,
    },
    {
      key: "provider",
      label: "Provayder",
      render: (p) => (
        <div>
          <span className="capitalize text-slate-600 font-medium">{p.provider}</span>
          {p.providerTransactionId && (
            <div className="text-[10px] text-slate-400 mt-0.5">ID: {p.providerTransactionId}</div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Holat",
      render: (p) => (
        <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", STATUS_COLORS[p.status] || "bg-slate-100 text-slate-700")}>
          {STATUS_LABELS[p.status] || p.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Sana",
      render: (p) => <span className="text-[var(--text-secondary)]">{new Date(p.createdAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (p) => (
        <div className="flex justify-end relative">
          <button
            onClick={() => setDropdownOpen(dropdownOpen === p.id ? null : p.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          {dropdownOpen === p.id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
              <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 overflow-hidden">
                <button
                  onClick={() => handleReconcile(p.id)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={16} className="text-slate-400" /> Muvofiqlashtirish
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard size={24} className="text-[var(--primary)]" />
            Tranzaksiyalar
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Mijozlar tomonidan amalga oshirilgan to'lovlar tarixi
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
          <Button onClick={fetchPayments} variant="secondary" icon={<RefreshCw size={16} />}>
            Yangilash
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyField="id"
        emptyMessage="Hech narsa topilmadi"
        isLoading={loading}
        isError={error}
        onRetry={fetchPayments}
        className="flex-1"
      />
    </div>
  );
}
