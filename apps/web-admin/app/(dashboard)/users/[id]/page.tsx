"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatDate, formatPrice, formatDateTime } from "@/lib/utils";
import { USER_STATUS_MAP, BOOKING_STATUS_MAP } from "@/lib/constants";
import {
  ArrowLeft, Ban, CheckCircle, MessageSquare, Mail, Gift, Trash2,
  CalendarCheck, CreditCard, AlertTriangle,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminApi } from "@/lib/api/admin-api";
import type { AdminHotelBooking, AdminManagedUser } from "@/types/admin";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<AdminManagedUser | null>(null);
  const [userBookings, setUserBookings] = useState<AdminHotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusAmount, setBonusAmount] = useState("");

  useEffect(() => {
    async function loadUser() {
      const [userData, bookings] = await Promise.all([
        AdminApi.getUser(id),
        AdminApi.getUserBookings(id),
      ]);
      setUser(userData);
      setUserBookings(bookings.slice(0, 5));
    }

    loadUser().finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg text-[var(--text-muted)]">Foydalanuvchi topilmadi</p>
        <Link href="/users" className="text-sm text-[var(--primary)] hover:underline">
          ← Ro&apos;yxatga qaytish
        </Link>
      </div>
    );
  }

  const handleStatusChange = async (status: "active" | "blocked" | "unverified") => {
    const updated = await AdminApi.updateUserStatus(id, status);
    setUser(updated);
    toast.success("Foydalanuvchi holati yangilandi!");
  };

  const handleDelete = async () => {
    if (confirm("Rostdan ham ushbu foydalanuvchini o'chirmoqchimisiz?")) {
      await AdminApi.deleteUser(id);
      toast.success("Foydalanuvchi o'chirildi!");
      router.push("/users");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/users"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Foydalanuvchilar ro&apos;yxatiga qaytish
      </Link>

      {/* Profile header */}
      <Card padding="lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-xl font-bold">
              {user.fullName.trim().split(/\s+/).filter(Boolean).map((n) => n[0]).join("")}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{user.fullName}</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={user.status} statusMap={USER_STATUS_MAP} />
                <span className="text-xs text-[var(--text-muted)]">ID: {user.id}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {user.status === "active" ? (
              <Button variant="danger" size="sm" icon={<Ban size={14} />} onClick={() => handleStatusChange("blocked")}>
                Bloklash
              </Button>
            ) : (
              <Button variant="accent" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleStatusChange("active")}>
                Faollashtirish
              </Button>
            )}
            <Button variant="secondary" size="sm" icon={<MessageSquare size={14} />} onClick={() => setSmsModalOpen(true)}>
              SMS
            </Button>
            <a href={`mailto:${user.email}`}>
              <Button variant="secondary" size="sm" icon={<Mail size={14} />}>
                Email
              </Button>
            </a>
            <Button variant="secondary" size="sm" icon={<Gift size={14} />} onClick={() => setBonusModalOpen(true)}>
              Bonus berish
            </Button>
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete}>
              O&apos;chirish
            </Button>
          </div>
        </div>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Telefon", value: user.phone },
          { label: "Ro'yxatdan o'tgan", value: formatDate(user.createdAt) },
          { label: "Oxirgi kirish", value: formatDateTime(user.lastLogin) },
          { label: "Bonus balansi", value: formatPrice(user.bonusBalance) },
        ].map((info) => (
          <Card key={info.label} padding="sm">
            <p className="text-xs text-[var(--text-muted)] mb-1">{info.label}</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{info.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: "bookings",
            label: "Bronlar tarixi",
            icon: <CalendarCheck size={16} />,
            count: user.bookingsCount,
            content: (
              <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Bron ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Xizmat</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Sana</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Summa</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {userBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{b.id}</td>
                        <td className="px-4 py-3 font-medium">{b.hotelName}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(b.createdAt)}</td>
                        <td className="px-4 py-3 font-medium">{formatPrice(b.amount)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={String(b.status)} statusMap={BOOKING_STATUS_MAP} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            id: "finance",
            label: "Moliya",
            icon: <CreditCard size={16} />,
            content: (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Jami sarflagan</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{formatPrice(user.totalSpent)}</p>
                </Card>
                <Card padding="md">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Jami bronlar</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{user.bookingsCount} ta</p>
                </Card>
                <Card padding="md">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Bonus balansi</p>
                  <p className="text-lg font-bold text-[var(--accent)]">{formatPrice(user.bonusBalance)}</p>
                </Card>
              </div>
            ),
          },
          {
            id: "complaints",
            label: "Shikoyatlar",
            icon: <AlertTriangle size={16} />,
            count: 0,
            content: (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Shikoyatlar yo&apos;q</p>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        title={`SMS yuborish — ${user.fullName}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSmsModalOpen(false)}>Bekor qilish</Button>
            <Button
              loading={smsSending}
              onClick={async () => {
                if (!smsMessage.trim()) {
                  toast.error("Xabar matnini kiriting");
                  return;
                }
                setSmsSending(true);
                try {
                  const result = await AdminApi.sendUserSms(id, smsMessage);
                  if (result.smsSent) {
                    toast.success(`SMS yuborildi: ${user.phone}`);
                    setSmsMessage("");
                    setSmsModalOpen(false);
                  } else {
                    toast.error(
                      result.smsError === "USER_HAS_NO_PHONE"
                        ? "Bu foydalanuvchida telefon raqami yo'q"
                        : "SMS yuborilmadi — provayder xatosi",
                    );
                  }
                } catch {
                  toast.error("SMS yuborishda xatolik yuz berdi");
                } finally {
                  setSmsSending(false);
                }
              }}
            >
              Yuborish
            </Button>
          </>
        }
      >
        <textarea
          value={smsMessage}
          onChange={(e) => setSmsMessage(e.target.value)}
          placeholder="Xabar matnini kiriting..."
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none resize-none"
        />
      </Modal>

      <Modal
        open={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        title={`Bonus berish — ${user.fullName}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBonusModalOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={async () => {
                const amount = parseInt(bonusAmount, 10);
                if (!amount || amount <= 0) {
                  toast.error("To'g'ri summa kiriting");
                  return;
                }
                const bonusBalance = await AdminApi.adjustUserBonus(id, amount);
                setUser((prev) => (prev ? { ...prev, bonusBalance } : prev));
                toast.success(`${formatPrice(amount)} bonus qo'shildi`);
                setBonusAmount("");
                setBonusModalOpen(false);
              }}
            >
              Berish
            </Button>
          </>
        }
      >
        <Input
          type="number"
          label="Bonus summasi (so'm)"
          placeholder="50000"
          value={bonusAmount}
          onChange={(e) => setBonusAmount(e.target.value)}
        />
      </Modal>
    </div>
  );
}
