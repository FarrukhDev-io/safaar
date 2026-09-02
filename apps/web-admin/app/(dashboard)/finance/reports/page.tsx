"use client";

import { useState, useEffect } from "react";
import { AdminApi } from "@/lib/api/admin-api";
import type { FinanceReport, ProviderReconciliation, FinanceDocument } from "@/types/admin";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import DataTable, { Column } from "@/components/ui/DataTable";
import { Download, FileText, CheckCircle2, AlertTriangle, RefreshCw, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export default function FinanceReportsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'reconciliation' | 'documents'>('reports');
  
  const [reports, setReports] = useState<FinanceReport[]>([]);
  const [reconciliations, setReconciliations] = useState<ProviderReconciliation[]>([]);
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [taxExportLoading, setTaxExportLoading] = useState(false);

  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      if (activeTab === 'reports') {
        const data = await AdminApi.getFinanceReports();
        setReports(data);
      } else if (activeTab === 'reconciliation') {
        const data = await AdminApi.getProviderReconciliation();
        setReconciliations(data);
      } else if (activeTab === 'documents') {
        const data = await AdminApi.getFinanceDocuments();
        setDocuments(data);
      }
    } catch (err) {
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (cancelled) return;
        setLoading(true);
        if (activeTab === 'reports') {
          const data = await AdminApi.getFinanceReports();
          if (!cancelled) setReports(data);
        } else if (activeTab === 'reconciliation') {
          const data = await AdminApi.getProviderReconciliation();
          if (!cancelled) setReconciliations(data);
        } else if (activeTab === 'documents') {
          const data = await AdminApi.getFinanceDocuments();
          if (!cancelled) setDocuments(data);
        }
      } catch {
        if (!cancelled) {
          toast.error("Ma'lumotlarni yuklab bo'lmadi");
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [activeTab]);

  const handleExportFinance = async () => {
    setExportLoading(true);
    try {
      const res = await AdminApi.exportFinance();
      window.open(res.url, "_blank");
      toast.success("Eksport qilindi");
    } catch (e) {
      toast.error("Eksport qilishda xatolik");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportTax = async () => {
    setTaxExportLoading(true);
    try {
      const res = await AdminApi.exportTaxReport();
      window.open(res.url, "_blank");
      toast.success("Soliq hisoboti eksport qilindi");
    } catch (e) {
      toast.error("Soliq hisobotini eksport qilishda xatolik");
    } finally {
      setTaxExportLoading(false);
    }
  };

  const handleRegenerateDoc = async (id: string) => {
    try {
      await AdminApi.regenerateFinanceDocument(id);
      toast.success("Hujjat qayta generatsiya qilinmoqda");
      fetchData();
    } catch (e) {
      toast.error("Hujjatni qayta yaratib bo'lmadi");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Moliya - Hisobotlar</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Tizimdagi barcha moliyaviy hisobotlar va solishtirish aktlari
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportFinance} loading={exportLoading} icon={<Download size={16} />}>
            Umumiy eksport (Excel)
          </Button>
          <Button onClick={handleExportTax} loading={taxExportLoading} icon={<FileText size={16} />}>
            Soliq hisoboti (Export)
          </Button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg self-start">
        <button
          onClick={() => setActiveTab('reports')}
          className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'reports' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
        >
          Umumiy Hisobotlar
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'reconciliation' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
        >
          Provayder solishtiruvi
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", activeTab === 'documents' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50")}
        >
          Hujjatlar (Invoys / Akt)
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'reports' && (
          <DataTable
            columns={[
              { key: "id", label: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
              { key: "title", label: "Hisobot nomi", render: (r) => <span className="font-medium">{r.title}</span> },
              { key: "period", label: "Davr" },
              { key: "totalRevenue", label: "Umumiy Daromad", render: (r) => <span className="font-semibold text-[var(--text-primary)]">{formatPrice(r.totalRevenue)}</span> },
              { key: "totalCommission", label: "Sof Komissiya", render: (r) => <span className="font-semibold text-[var(--success)]">{formatPrice(r.totalCommission)}</span> },
              { key: "dateGenerated", label: "Sana", render: (r) => <span>{formatDate(r.dateGenerated)}</span> },
            ]}
            data={reports}
            keyField="id"
            emptyMessage="Ma'lumot topilmadi"
            isLoading={loading}
            isError={error}
            onRetry={fetchData}
            className="flex-1"
          />
        )}

        {activeTab === 'reconciliation' && (
          <DataTable
            columns={[
              { key: "provider", label: "Provayder", render: (r) => <span className="font-medium capitalize">{r.provider}</span> },
              { key: "expectedAmount", label: "Kutilayotgan Summa", render: (r) => formatPrice(r.expectedAmount) },
              { key: "actualAmount", label: "Haqiqiy Summa", render: (r) => formatPrice(r.actualAmount) },
              { key: "difference", label: "Farq", render: (r) => <span className={cn("font-semibold", r.difference !== 0 ? "text-red-500" : "text-emerald-500")}>{formatPrice(r.difference)}</span> },
              { 
                key: "status", 
                label: "Holat", 
                render: (r) => r.status === 'matched' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-medium">
                    <CheckCircle2 size={14} /> Muvofiq
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-xs font-medium">
                    <AlertTriangle size={14} /> Farq mavjud
                  </span>
                )
              },
              { key: "lastSyncedAt", label: "Sinxronlash vaqti", render: (r) => <span>{formatDate(r.lastSyncedAt)}</span> },
            ]}
            data={reconciliations}
            keyField="provider"
            emptyMessage="Solishtirish ma'lumotlari topilmadi"
            isLoading={loading}
            isError={error}
            onRetry={fetchData}
            className="flex-1"
          />
        )}

        {activeTab === 'documents' && (
          <DataTable
            columns={[
              { key: "title", label: "Hujjat nomi", render: (r) => <span className="font-medium">{r.title}</span> },
              { key: "type", label: "Turi", render: (r) => <span className="capitalize text-slate-600">{r.type.replace('_', ' ')}</span> },
              { key: "partnerName", label: "Hamkor", render: (r) => r.partnerName || "—" },
              { key: "period", label: "Davr" },
              { 
                key: "status", 
                label: "Holat", 
                render: (r) => r.status === 'generated' ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">Tayyor</span>
                ) : r.status === 'pending' ? (
                  <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 inline-flex">
                    <RefreshCw size={12} className="animate-spin" /> Yaratilmoqda
                  </span>
                ) : (
                  <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">Xatolik</span>
                )
              },
              {
                key: "actions",
                label: "",
                render: (r) => (
                  <div className="flex justify-end gap-2">
                    {r.status === 'generated' && r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Yuklab olish">
                        <Download size={18} />
                      </a>
                    )}
                    <button onClick={() => handleRegenerateDoc(r.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="Qayta generatsiya qilish">
                      <RefreshCcw size={18} />
                    </button>
                  </div>
                )
              }
            ]}
            data={documents}
            keyField="id"
            emptyMessage="Hujjatlar topilmadi"
            isLoading={loading}
            isError={error}
            onRetry={fetchData}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}
