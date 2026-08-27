"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Code2, Key, Globe, Trash2, CheckCircle2, XCircle, Copy, Send, History, RotateCcw, Power } from "lucide-react";
import {
  PartnerApiKey,
  PartnerWebhook,
  listApiKeys,
  createApiKey,
  deleteApiKey,
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookDeliveries,
  retryWebhookDelivery,
} from "@/app/_lib/api/endpoints/partners";
import { toApiKey, toWebhook, toWebhookDelivery, WebhookDelivery } from "@/app/_lib/api/adapters";
import { formatDate, formatDateTime } from "@/app/_lib/utils/format";
import { useAuthStore } from "@/app/_stores/auth-store";

export default function DeveloperSettingsPage() {
  const token = useAuthStore((s) => s.tokens?.accessToken);
  const [apiKeys, setApiKeys] = useState<PartnerApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<PartnerWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks">("keys");
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeyString, setNewKeyString] = useState<string | null>(null);

  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [togglingWebhookId, setTogglingWebhookId] = useState<string | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  const [logsWebhook, setLogsWebhook] = useState<PartnerWebhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [deliveriesError, setDeliveriesError] = useState(false);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [keysData, webhooksData] = await Promise.all([
        listApiKeys(token),
        listWebhooks(token),
      ]);
      setApiKeys(keysData.map(toApiKey));
      setWebhooks(webhooksData.map(toWebhook));
    } catch {
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    setSubmitting(true);
    try {
      const data = await createApiKey({ name: keyName }, token);
      setNewKeyString(toApiKey(data).key ?? null);
      setKeyName("");
      fetchData();
    } catch {
      toast.error("Kalit yaratishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;
    setSubmitting(true);
    try {
      await createWebhook({ url: webhookUrl, events: ["booking.created", "booking.updated"] }, token);
      toast.success("Webhook qo'shildi");
      setShowWebhookModal(false);
      setWebhookUrl("");
      fetchData();
    } catch {
      toast.error("Webhook qo'shishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Kalitni o'chirmoqchimisiz?")) return;
    try {
      await deleteApiKey(id, token);
      toast.success("Kalit o'chirildi");
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch {
      toast.error("Xatolik");
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Webhookni o'chirmoqchimisiz?")) return;
    try {
      await deleteWebhook(id, token);
      toast.success("Webhook o'chirildi");
      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch {
      toast.error("Xatolik");
    }
  };

  const handleToggleWebhook = async (webhook: PartnerWebhook) => {
    setTogglingWebhookId(webhook.id);
    try {
      const updated = await updateWebhook(
        webhook.id,
        { status: webhook.isActive ? "disabled" : "active" },
        token,
      );
      const mapped = toWebhook(updated);
      setWebhooks((prev) => prev.map((w) => (w.id === webhook.id ? mapped : w)));
      toast.success(mapped.isActive ? "Webhook faollashtirildi" : "Webhook o'chirildi");
    } catch (e) {
      toast.error("Holatni o'zgartirib bo'lmadi");
    } finally {
      setTogglingWebhookId(null);
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingWebhookId(id);
    try {
      await testWebhook(id, token);
      toast.success("Test so'rovi yuborildi. Natijani 'Loglar'dan ko'ring.");
    } catch (e: any) {
      toast.error(e?.message || "Test yuborishda xatolik");
    } finally {
      setTestingWebhookId(null);
    }
  };

  const fetchDeliveries = async (webhook: PartnerWebhook) => {
    setLogsWebhook(webhook);
    setDeliveriesLoading(true);
    setDeliveriesError(false);
    try {
      const data = await getWebhookDeliveries(webhook.id, token);
      setDeliveries(data.map(toWebhookDelivery));
    } catch (e) {
      setDeliveriesError(true);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    setRetryingDeliveryId(deliveryId);
    try {
      await retryWebhookDelivery(deliveryId, token);
      toast.success("Qayta yuborish navbatga qo'shildi");
      if (logsWebhook) await fetchDeliveries(logsWebhook);
    } catch (e: any) {
      toast.error(e?.message || "Qayta yuborishda xatolik");
    } finally {
      setRetryingDeliveryId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nusxa olindi!");
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Yuklanmoqda...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code2 size={20} className="text-[var(--primary)]" />
            Dasturchi va API
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            API kalitlar va Webhook integratsiyalarini boshqarish.
          </p>
        </div>
      </div>

      <div className="flex border-b border-[var(--border)] gap-6">
        <button
          onClick={() => setActiveTab("keys")}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "keys" ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
        >
          <span className="flex items-center gap-2"><Key size={16} /> API Kalitlar</span>
          {activeTab === "keys" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "webhooks" ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
        >
          <span className="flex items-center gap-2"><Globe size={16} /> Webhooklar</span>
          {activeTab === "webhooks" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}
        </button>
      </div>

      {activeTab === "keys" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <div>
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Shaxsiy API Kalitlar</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">O'z tizimingiz bilan integratsiya qilish uchun kalit yarating.</p>
            </div>
            <button
              onClick={() => setShowKeyModal(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Yangi kalit
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--card)] overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">Nomi</th>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">Prefiks</th>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">Yaratilgan</th>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {apiKeys.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-[var(--muted-foreground)]">Kalitlar mavjud emas</td></tr>
                ) : apiKeys.map((k) => (
                  <tr key={k.id}>
                    <td className="px-5 py-4 font-medium">{k.name}</td>
                    <td className="px-5 py-4 font-mono text-xs text-[var(--muted-foreground)]">{k.keyPrefix}••••••••</td>
                    <td className="px-5 py-4 text-xs text-[var(--muted-foreground)]">{formatDate(k.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDeleteKey(k.id)} className="text-[var(--destructive)] p-1 hover:bg-[var(--destructive)]/10 rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <div>
              <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Webhook Integratsiya</h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">Yangi bronlar bo'yicha tezkor xabarnomalar olish uchun Webhook sozlang.</p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Webhook qo'shish
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--card)] overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                <tr>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">URL Manzil</th>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">Holat</th>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">Yaratilgan</th>
                  <th className="px-5 py-3 font-medium text-[var(--muted-foreground)]">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {webhooks.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-[var(--muted-foreground)]">Webhooklar mavjud emas</td></tr>
                ) : webhooks.map((w) => (
                  <tr key={w.id}>
                    <td className="px-5 py-4 font-mono text-xs text-blue-600 max-w-[250px] truncate">{w.url}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleWebhook(w)}
                        disabled={togglingWebhookId === w.id}
                        className="inline-flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                        title={w.isActive ? "O'chirish uchun bosing" : "Yoqish uchun bosing"}
                      >
                        {w.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 size={14} /> Faol</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={14} /> O'chirilgan</span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--muted-foreground)]">{formatDate(w.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTestWebhook(w.id)}
                          disabled={testingWebhookId === w.id}
                          title="Test yuborish"
                          className="text-[var(--muted-foreground)] p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          onClick={() => fetchDeliveries(w)}
                          title="Yetkazish loglari"
                          className="text-[var(--muted-foreground)] p-1.5 hover:bg-[var(--muted)] rounded"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleWebhook(w)}
                          disabled={togglingWebhookId === w.id}
                          title={w.isActive ? "O'chirish" : "Yoqish"}
                          className="text-[var(--muted-foreground)] p-1.5 hover:bg-[var(--muted)] rounded disabled:opacity-50"
                        >
                          <Power size={16} />
                        </button>
                        <button onClick={() => handleDeleteWebhook(w.id)} title="O'chirish (butunlay)" className="text-[var(--destructive)] p-1.5 hover:bg-[var(--destructive)]/10 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--background)] p-6 shadow-xl border border-[var(--border)]">
            {newKeyString ? (
              <div className="flex flex-col gap-4 text-center">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold">API Kalit Yaratildi</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Quyidagi kalitni saqlab oling. Bu kalit boshqa ko'rsatilmaydi!
                </p>
                <div className="bg-[var(--muted)] p-3 rounded-lg flex items-center justify-between gap-2 border border-[var(--border)]">
                  <code className="text-xs break-all text-left">{newKeyString}</code>
                  <button onClick={() => copyToClipboard(newKeyString)} className="p-2 hover:bg-white rounded text-[var(--primary)]">
                    <Copy size={16} />
                  </button>
                </div>
                <button
                  onClick={() => { setShowKeyModal(false); setNewKeyString(null); }}
                  className="mt-2 w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
                >
                  Yopish
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Yangi API Kalit</h3>
                <form onSubmit={handleCreateKey} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--muted-foreground)]">Kalit nomi</label>
                    <input
                      type="text"
                      required
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                      placeholder="Masalan: Test Environment"
                    />
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowKeyModal(false)} className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-md">Bekor qilish</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md disabled:opacity-50">Yaratish</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--background)] p-6 shadow-xl border border-[var(--border)]">
            <h3 className="text-lg font-semibold mb-4">Webhook Qo'shish</h3>
            <form onSubmit={handleCreateWebhook} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--muted-foreground)]">Endpoint URL</label>
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowWebhookModal(false)} className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-md">Bekor qilish</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md disabled:opacity-50">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {logsWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl bg-[var(--background)] shadow-xl border border-[var(--border)]">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-semibold">Yetkazish loglari</h3>
                <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5 truncate max-w-md">{logsWebhook.url}</p>
              </div>
              <button
                onClick={() => { setLogsWebhook(null); setDeliveries([]); }}
                aria-label="Yopish"
                className="text-[var(--muted-foreground)] hover:bg-[var(--muted)] p-1.5 rounded"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {deliveriesLoading ? (
                <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Yuklanmoqda...</div>
              ) : deliveriesError ? (
                <div className="p-8 flex flex-col items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <p>Loglarni yuklab bo'lmadi</p>
                  <button onClick={() => fetchDeliveries(logsWebhook)} className="text-[var(--primary)] hover:underline">
                    Qayta urinish
                  </button>
                </div>
              ) : deliveries.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">Hali yetkazish urinishlari yo'q</div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {deliveries.map((d) => (
                    <div key={d.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{d.eventType}</span>
                          <DeliveryStatusBadge status={d.status} />
                          {d.responseStatus !== null && (
                            <span className="text-xs font-mono text-[var(--muted-foreground)]">HTTP {d.responseStatus}</span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {d.attemptedAt ? formatDateTime(d.attemptedAt) : formatDateTime(d.createdAt)}
                        </span>
                      </div>
                      {d.status === "failed" && (
                        <button
                          onClick={() => handleRetryDelivery(d.id)}
                          disabled={retryingDeliveryId === d.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline disabled:opacity-50 shrink-0"
                        >
                          <RotateCcw size={13} />
                          {retryingDeliveryId === d.id ? "Yuborilmoqda..." : "Qayta urinish"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: "bg-emerald-100 text-emerald-700",
    queued: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    skipped: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
