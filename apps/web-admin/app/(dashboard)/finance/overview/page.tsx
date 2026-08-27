"use client";

import { useState, useEffect } from "react";
import { AdminApi } from "@/lib/api/admin-api";
import { Wallet, ArrowDownToLine, FileSpreadsheet, TrendingUp, Download, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { FinanceOverviewData, RevenueData } from "@/types/admin";
import { toast } from "sonner";

export default function FinanceOverviewPage() {
  const [overview, setOverview] = useState<FinanceOverviewData | null>(null);
  const [chartData, setChartData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [overviewData, chart] = await Promise.all([
        AdminApi.getFinanceOverview(),
        AdminApi.getFinanceRevenueChart()
      ]);
      setOverview(overviewData);
      setChartData(chart);
    } catch (err) {
      toast.error("Moliya ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [overviewData, chart] = await Promise.all([
          AdminApi.getFinanceOverview(),
          AdminApi.getFinanceRevenueChart()
        ]);
        if (!cancelled) {
          setOverview(overviewData);
          setChartData(chart);
        }
      } catch {
        if (!cancelled) toast.error("Moliya ma'lumotlarini yuklab bo'lmadi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Moliya - Umumiy Ko'rinish</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Platformaning barcha moliyaviy aylanmalari va komissiya foydasi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchOverview}>Yangilash</Button>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => window.print()}>PDF Hisobot</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Umumiy Tushum</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(overview?.totalRevenue ?? 0)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Sof Komissiya</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(overview?.totalCommission ?? 0)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <ArrowDownToLine size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Kutilayotgan Chiqim</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(overview?.pendingWithdrawals ?? 0)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Qaytarishlar (Refunds)</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(overview?.totalRefunds ?? 0)}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="text-[var(--primary)]" size={20} />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Daromadlar grafigi</h2>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-64 flex items-end gap-4 overflow-x-auto pb-4">
            {chartData.map((d, i) => {
              const maxVal = Math.max(...chartData.map(c => c.partnerPayment + c.commission)) || 1;
              const total = d.partnerPayment + d.commission;
              const height = (total / maxVal) * 100;
              
              return (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[60px] group">
                  <div className="relative w-12 bg-slate-100 rounded-t-md flex flex-col justify-end overflow-hidden" style={{ height: '200px' }}>
                    <div className="w-full bg-blue-500/20" style={{ height: `${(d.partnerPayment / total) * height}%` }} title={`Hamkorga: ${formatPrice(d.partnerPayment)}`} />
                    <div className="w-full bg-emerald-500" style={{ height: `${(d.commission / total) * height}%` }} title={`Komissiya: ${formatPrice(d.commission)}`} />
                  </div>
                  <div className="text-xs font-medium text-slate-500">{d.month}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-secondary)]">
            <p className="text-[var(--text-muted)] text-sm font-medium">Daromad grafigi uchun ma'lumot topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
