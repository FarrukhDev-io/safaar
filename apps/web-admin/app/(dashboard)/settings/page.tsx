"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, Save, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import { AdminApi } from "@/lib/api/admin-api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    commissionRate: "15",
    busCommissionRate: "10",
    maintenanceMode: false,
    contactEmail: "support@safaar.uz",
  });

  useEffect(() => {
    let cancelled = false;
    AdminApi.getSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Sozlamalarni yuklab bo'lmadi.");
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await AdminApi.updateSettings(settings);
      toast.success("Sozlamalar saqlandi!");
    } catch {
      toast.error("Sozlamalarni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Platformaning asosiy komissiya foizlari va texnik xizmat sozlamalari
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading || fetching} className="flex items-center gap-2">
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={16} />}
          Saqlash
        </Button>
      </div>

      <div className="space-y-6">
        {/* Moliya */}
        <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              %
            </span>
            Moliyaviy Sozlamalar
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Mehmonxonalar komissiyasi (%)</label>
              <input
                type="number"
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Avtobuslar komissiyasi (%)</label>
              <input
                type="number"
                value={settings.busCommissionRate}
                onChange={(e) => setSettings({ ...settings, busCommissionRate: e.target.value })}
                className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Tizim */}
        <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Settings size={18} />
            </span>
            Tizim Sozlamalari
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Yordam elektron pochtasi</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full max-w-md px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
              />
            </div>
            
            <div className="p-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[var(--danger)] shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--danger)]">Texnik Xizmat Rejimi (Maintenance Mode)</h3>
                <p className="text-xs text-slate-600 mt-1 mb-3">
                  Agar buni yoqsangiz, asosiy sayt barcha foydalanuvchilar va hamkorlar uchun vaqtinchalik o'chiriladi.
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--danger)]"></div>
                  <span className="ml-3 text-sm font-medium text-[var(--text-primary)]">
                    {settings.maintenanceMode ? "Yoqilgan" : "O'chirilgan"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
