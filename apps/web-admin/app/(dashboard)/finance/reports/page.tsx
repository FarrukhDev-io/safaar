"use client";

import { useState, useEffect } from "react";
import { AdminApi } from "@/lib/api/admin-api";
import type { FinanceReport, ProviderReconciliation, FinanceDocument } from "@/types/admin";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
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

  const fetchData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

      <div className="flex-1 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="inline-block w-8 h-8 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-medium">
                {activeTab === 'reports' && (
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Hisobot nomi</th>
                    <th className="px-6 py-4">Davr</th>
                    <th className="px-6 py-4">Umumiy Daromad</th>
                    <th className="px-6 py-4">Sof Komissiya</th>
                    <th className="px-6 py-4">Sana</th>
                  </tr>
                )}
                {activeTab === 'reconciliation' && (
                  <tr>
                    <th className="px-6 py-4">Provayder</th>
                    <th className="px-6 py-4">Kutilayotgan Summa</th>
                    <th className="px-6 py-4">Haqiqiy Summa</th>
                    <th className="px-6 py-4">Farq</th>
                    <th className="px-6 py-4">Holat</th>
                    <th className="px-6 py-4">Sinxronlash vaqti</th>
                  </tr>
                )}
                {activeTab === 'documents' && (
                  <tr>
                    <th className="px-6 py-4">Hujjat nomi</th>
                    <th className="px-6 py-4">Turi</th>
                    <th className="px-6 py-4">Hamkor</th>
                    <th className="px-6 py-4">Davr</th>
                    <th className="px-6 py-4">Holat</th>
                    <th className="px-6 py-4 text-right">Amallar</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activeTab === 'reports' && reports.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">Ma'lumot topilmadi</td></tr>
                )}
                {activeTab === 'reports' && reports.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{row.id}</td>
                    <td className="px-6 py-4 font-medium">{row.title}</td>
                    <td className="px-6 py-4 text-sm">{row.period}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{formatPrice(row.totalRevenue)}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--success)]">{formatPrice(row.totalCommission)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(row.dateGenerated)}</td>
                  </tr>
                ))}

                {activeTab === 'reconciliation' && reconciliations.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">Solishtirish ma'lumotlari topilmadi</td></tr>
                )}
                {activeTab === 'reconciliation' && reconciliations.map((row, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4 font-medium capitalize">{row.provider}</td>
                    <td className="px-6 py-4">{formatPrice(row.expectedAmount)}</td>
                    <td className="px-6 py-4">{formatPrice(row.actualAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={cn("font-semibold", row.difference !== 0 ? "text-red-500" : "text-emerald-500")}>
                        {formatPrice(row.difference)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.status === 'matched' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-medium">
                          <CheckCircle2 size={14} /> Muvofiq
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-xs font-medium">
                          <AlertTriangle size={14} /> Farq mavjud
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDate(row.lastSyncedAt)}</td>
                  </tr>
                ))}

                {activeTab === 'documents' && documents.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">Hujjatlar topilmadi</td></tr>
                )}
                {activeTab === 'documents' && documents.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4 font-medium">{row.title}</td>
                    <td className="px-6 py-4 capitalize text-slate-600">{row.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4">{row.partnerName || "—"}</td>
                    <td className="px-6 py-4 text-sm">{row.period}</td>
                    <td className="px-6 py-4">
                      {row.status === 'generated' ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">Tayyor</span>
                      ) : row.status === 'pending' ? (
                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 inline-flex">
                          <RefreshCw size={12} className="animate-spin" /> Yaratilmoqda
                        </span>
                      ) : (
                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">Xatolik</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {row.status === 'generated' && row.url && (
                          <a href={row.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Yuklab olish">
                            <Download size={18} />
                          </a>
                        )}
                        <button onClick={() => handleRegenerateDoc(row.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="Qayta generatsiya qilish">
                          <RefreshCcw size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
