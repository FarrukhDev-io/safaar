"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Shield, Search, MoreVertical, Key, Edit, Ban, CheckCircle2, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
import Button from "@/components/ui/Button";
import { AdminApi } from "@/lib/api/admin-api";
import { AdminUser, AdminRole } from "@/types/admin";
import { useAuthStore } from "@/lib/store/auth";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MODERATOR: "Moderator",
  FINANCE_ADMIN: "Moliya Admini",
  CONTENT_ADMIN: "Kontent Admini",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  MODERATOR: "bg-blue-100 text-blue-700 border-blue-200",
  FINANCE_ADMIN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CONTENT_ADMIN: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function TeamPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user: currentUser } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    role: AdminRole;
    password?: string;
  }>({
    fullName: "",
    email: "",
    phone: "",
    role: "MODERATOR",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await AdminApi.getTeamUsers();
      setUsers(data);
    } catch (err) {
      toast.error("Xodimlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ fullName: "", email: "", phone: "", role: "MODERATOR", password: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUser) => {
    setEditingUser(u);
    setFormData({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      password: "",
    });
    setIsModalOpen(true);
    setDropdownOpen(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.role) {
      return toast.error("Barcha majburiy maydonlarni to'ldiring");
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await AdminApi.updateTeamUser(editingUser.id, formData);
        toast.success("Xodim ma'lumotlari yangilandi");
      } else {
        if (!formData.password) return toast.error("Parol kiritish majburiy");
        await AdminApi.createTeamUser(formData);
        toast.success("Yangi xodim qo'shildi");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await AdminApi.updateTeamUserStatus(id, !currentStatus);
      toast.success(currentStatus ? "Xodim bloklandi" : "Xodim faollashtirildi");
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      toast.error("Holatni o'zgartirib bo'lmadi");
    }
    setDropdownOpen(null);
  };

  const handleReset2FA = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu xodimning 2FA himoyasini olib tashlamoqchimisiz?")) return;
    try {
      await AdminApi.resetTeamUser2FA(id);
      toast.success("2FA muvaffaqiyatli o'chirildi");
    } catch (err) {
      toast.error("2FA ni o'chirib bo'lmadi");
    }
    setDropdownOpen(null);
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Jamoasi</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Platformani boshqaruvchi xodimlar va ularning ruxsatlari
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
          <Button onClick={openAddModal} icon={<Plus size={16} />}>
            Xodim qo'shish
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-medium">
              <tr>
                <th className="px-6 py-4">Xodim</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">So'nggi faollik</th>
                <th className="px-6 py-4">Holat</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    Hech narsa topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            {u.fullName}
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">Siz</span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                            <Mail size={12} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", ROLE_COLORS[u.role] || "bg-slate-100 text-slate-700")}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.phone ? (
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Phone size={14} /> {u.phone}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Calendar size={14} />
                        {new Date(u.lastLogin).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-red-500")} />
                        {u.isActive ? "Faol" : "Bloklangan"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {dropdownOpen === u.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 overflow-hidden">
                              <button
                                onClick={() => openEditModal(u)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Edit size={16} className="text-slate-400" /> Tahrirlash
                              </button>
                              
                              <button
                                onClick={() => handleReset2FA(u.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Key size={16} className="text-slate-400" /> 2FA ni o'chirish
                              </button>
                              
                              <div className="h-px bg-slate-100 my-1" />
                              
                              {u.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleToggleStatus(u.id, u.isActive)}
                                  className={cn(
                                    "w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors",
                                    u.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                                  )}
                                >
                                  {u.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                                  {u.isActive ? "Bloklash" : "Faollashtirish"}
                                </button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editingUser ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">F.I.SH</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  placeholder="Ism Familiya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  placeholder="admin@safaar.uz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  placeholder="+998..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                >
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Parol {editingUser && <span className="text-slate-400 font-normal">(o'zgartirish uchun kiriting)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" loading={submitting} className="flex-1">
                  Saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
