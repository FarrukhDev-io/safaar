"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, Plus, Search, MoreVertical, Play, XCircle, Users, Building2, Globe } from "lucide-react";
import Button from "@/components/ui/Button";
import { AdminApi } from "@/lib/api/admin-api";
import { BroadcastNotification } from "@/types/admin";
import { cn } from "@/lib/utils";

const TARGET_ICONS = {
  all: <Globe size={14} className="text-blue-500" />,
  users: <Users size={14} className="text-emerald-500" />,
  partners: <Building2 size={14} className="text-purple-500" />,
};

const TARGET_LABELS = {
  all: "Barchaga",
  users: "Mijozlarga",
  partners: "Hamkorlarga",
};

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  sending: "bg-blue-100 text-blue-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  draft: "Qoralama",
  sending: "Yuborilmoqda",
  sent: "Yuborilgan",
  failed: "Xatolik",
};

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    targetType: "all",
  });
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const fetchBroadcasts = async () => {
    try {
      const data = await AdminApi.getBroadcasts();
      setBroadcasts(data);
    } catch (err) {
      toast.error("Xabarnomalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      return toast.error("Sarlavha va matnni kiriting");
    }

    setSubmitting(true);
    try {
      await AdminApi.createBroadcast(formData);
      toast.success("Xabarnoma saqlandi");
      setIsModalOpen(false);
      setFormData({ title: "", body: "", targetType: "all" });
      fetchBroadcasts();
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: 'send' | 'cancel') => {
    try {
      await AdminApi.broadcastAction(id, action);
      toast.success(action === 'send' ? "Yuborish boshlandi" : "Bekor qilindi");
      fetchBroadcasts();
    } catch (err: any) {
      toast.error("Amalni bajarib bo'lmadi");
    }
    setDropdownOpen(null);
  };

  const filtered = broadcasts.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Send size={24} className="text-[var(--primary)]" />
            Ommaviy Xabarnomalar
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Platformadagi foydalanuvchilar va hamkorlarga bildirishnoma (push/in-app) yuborish
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Izlash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none w-full sm:w-64 transition-all"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
            Yangi xabarnoma
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-medium">
              <tr>
                <th className="px-6 py-4">Sarlavha</th>
                <th className="px-6 py-4">Maqsad (K аудитория)</th>
                <th className="px-6 py-4">Holat</th>
                <th className="px-6 py-4">Yuborildi</th>
                <th className="px-6 py-4">Yaratilgan sana</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    <span className="inline-block w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    Hech narsa topilmadi
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--text-primary)] max-w-xs truncate" title={b.title}>
                        {b.title}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] max-w-xs truncate mt-0.5" title={b.message}>
                        {b.message}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        {TARGET_ICONS[b.targetType as keyof typeof TARGET_ICONS]}
                        {TARGET_LABELS[b.targetType as keyof typeof TARGET_LABELS] || b.targetType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", STATUS_COLORS[b.status] || "bg-slate-100 text-slate-700")}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs font-semibold">
                        {b.sentCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(b.createdAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === b.id ? null : b.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {dropdownOpen === b.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 overflow-hidden">
                              {b.status === 'draft' && (
                                <button
                                  onClick={() => handleAction(b.id, 'send')}
                                  className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors font-medium"
                                >
                                  <Play size={16} /> Yuborishni boshlash
                                </button>
                              )}
                              
                              {b.status === 'sending' && (
                                <button
                                  onClick={() => handleAction(b.id, 'cancel')}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                                >
                                  <XCircle size={16} /> Bekor qilish (Cancel)
                                </button>
                              )}
                              
                              {b.status !== 'draft' && b.status !== 'sending' && (
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Yangi xabarnoma</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Kime (Target)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: "all" })}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium border flex justify-center items-center gap-2 transition-all",
                      formData.targetType === "all" ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Globe size={16} /> Barchaga
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: "users" })}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium border flex justify-center items-center gap-2 transition-all",
                      formData.targetType === "users" ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Users size={16} /> Mijozlarga
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: "partners" })}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium border flex justify-center items-center gap-2 transition-all",
                      formData.targetType === "partners" ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Building2 size={16} /> Hamkorlarga
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Sarlavha</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  placeholder="Xabarnoma sarlavhasi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Matn (Xabar)</label>
                <textarea
                  required
                  rows={4}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all resize-none"
                  placeholder="Asosiy matn..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" loading={submitting} className="flex-1">
                  Saqlash (Qoralama)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
