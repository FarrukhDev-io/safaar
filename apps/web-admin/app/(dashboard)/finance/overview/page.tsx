"use client";

import { useState, useEffect } from "react";
import { MockApi } from "@/lib/api/mock-api";
import { Wallet, ArrowDownToLine, FileSpreadsheet, TrendingUp, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import RevenueBarChart from "@/components/charts/BarChart";
import { formatPrice } from "@/lib/utils";
import { revenueData } from "@/lib/mock-data";

interface DashboardStats {
  revenue: number;
}

export default function FinanceOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([MockApi.getDashboardStats(), MockApi.getWithdrawals()]).then(
      ([data, withdrawals]) => {
        setStats(data);
        setPendingWithdrawals(
          withdrawals
            .filter((w) => w.status === "pending")
            .reduce((sum, w) => sum + w.amount, 0),
        );
        setLoading(false);
      },
    );
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
        
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => window.print()}>PDF Hisobot</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Umumiy Daromad</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(stats?.revenue ?? 0)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Komissiya foydasi (15%)</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(Math.round((stats?.revenue ?? 0) * 0.15))}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center text-[var(--warning)]">
              <ArrowDownToLine size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Kutilayotgan to'lovlar</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(pendingWithdrawals)}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-[var(--border)] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="text-[var(--primary)]" size={20} />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Daromadlar grafigi</h2>
        </div>
        <RevenueBarChart data={revenueData} />
      </div>
    </div>
  );
}
