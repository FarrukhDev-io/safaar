"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Code2, Key, Globe, Trash2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { AdminApi } from "@/lib/api/admin-api";
import { DeveloperApiKey, DeveloperWebhook } from "@/types/admin";
import { cn, formatDate } from "@/lib/utils";
import Tabs from "@/components/ui/Tabs";

export default function DeveloperPage() {
  const [apiKeys, setApiKeys] = useState<DeveloperApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<DeveloperWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [keysData, webhooksData] = await Promise.all([
        AdminApi.getDeveloperApiKeys(),
        AdminApi.getDeveloperWebhooks(),
      ]);
      setApiKeys(keysData);
      setWebhooks(webhooksData);
    } catch (err) {
      toast.error("Dasturchi ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm("Rostdan ham ushbu API kalitini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi va hamkor integratsiyasi ishlamay qoladi.")) return;
    setDeleteLoading(id);
    try {
      await AdminApi.deleteDeveloperApiKey(id);
      toast.success("API kalit o'chirildi");
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (err: any) {
      toast.error("API kalitni o'chirib bo'lmadi");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Code2 size={24} className="text-[var(--primary)]" />
            Dasturchi API
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Hamkorlarning API kalitlari va webhook integratsiyalarini boshqarish
          </p>
        </div>
        <Button variant="secondary" onClick={fetchData}>
          Yangilash
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-amber-800 text-sm">Xavfsizlik ogohlantirishi</h3>
          <p className="text-amber-700 text-sm mt-1">
            Bu yerda barcha hamkorlarning maxfiy API kalitlari ko'rinishi qisman tasvirlangan. 
            Kalitlarni o'chirish faqat favqulodda vaziyatlarda (masalan, kalit oshkor bo'lib qolsa) amalga oshirilishi kerak.
          </p>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            id: "api-keys",
            label: "API Kalitlar",
            icon: <Key size={16} />,
            count: apiKeys.length,
            content: (
              <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-medium">
                      <tr>
                        <th className="px-6 py-4">Kompaniya</th>
                        <th className="px-6 py-4">Kalit nomi</th>
                        <th className="px-6 py-4">Prefiks</th>
                        <th className="px-6 py-4">Yaratilgan sana</th>
                        <th className="px-6 py-4">So'nggi faollik</th>
                        <th className="px-6 py-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {apiKeys.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">API kalitlar topilmadi</td></tr>
                      ) : apiKeys.map(k => (
                        <tr key={k.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                          <td className="px-6 py-4 font-medium">{k.partnerName}</td>
                          <td className="px-6 py-4 text-slate-600">{k.name}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                              {k.keyPrefix}••••••••
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{formatDate(k.createdAt)}</td>
                          <td className="px-6 py-4 text-slate-500">{k.lastUsedAt ? formatDate(k.lastUsedAt) : "Hech qachon"}</td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="danger" 
                              size="sm" 
                              icon={<Trash2 size={14} />} 
                              onClick={() => handleDeleteApiKey(k.id)}
                              loading={deleteLoading === k.id}
                            >
                              O'chirish
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          },
          {
            id: "webhooks",
            label: "Webhooklar",
            icon: <Globe size={16} />,
            count: webhooks.length,
            content: (
              <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-medium">
                      <tr>
                        <th className="px-6 py-4">Kompaniya</th>
                        <th className="px-6 py-4">URL</th>
                        <th className="px-6 py-4">Hodisalar</th>
                        <th className="px-6 py-4">Holat</th>
                        <th className="px-6 py-4">Xatoliklar</th>
                        <th className="px-6 py-4">Sana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {webhooks.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">Webhooklar topilmadi</td></tr>
                      ) : webhooks.map(w => (
                        <tr key={w.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                          <td className="px-6 py-4 font-medium">{w.partnerName}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate max-w-[250px] inline-block">
                              {w.url}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                              {w.events.map(e => (
                                <span key={e} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{e}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {w.isActive ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">
                                <CheckCircle2 size={14} /> Faol
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                                <XCircle size={14} /> O'chirilgan
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {w.failedDeliveries > 0 ? (
                              <span className="text-red-600 font-semibold">{w.failedDeliveries} marta</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{formatDate(w.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
