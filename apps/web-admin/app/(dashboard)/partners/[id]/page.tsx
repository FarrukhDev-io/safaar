"use client";

import { use, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { mockHotelBookings } from "@/lib/mock-data";
import { formatDate, formatPrice } from "@/lib/utils";
import { PARTNER_STATUS_MAP, BOOKING_STATUS_MAP } from "@/lib/constants";
import {
  ArrowLeft, Ban, CheckCircle, Pause, Mail, MessageSquare, Trash2,
  Hotel, Bus, Star, CalendarCheck, CreditCard, Pencil, MessageCircle, Home, Bed, Trees, UtensilsCrossed
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store";
import { toast } from "sonner";
import { PartnerTypeDisplay } from "@/components/ui/PartnerTypeDisplay";

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const partners = useAdminStore((s) => s.partners);
  const updatePartnerStatus = useAdminStore((s) => s.updatePartnerStatus);
  const updatePartnerCommission = useAdminStore((s) => s.updatePartnerCommission);
  const partnerNotes = useAdminStore((s) => s.partnerNotes);
  const setPartnerNote = useAdminStore((s) => s.setPartnerNote);
  const partner = partners.find((p) => p.id === id);

  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [commissionInput, setCommissionInput] = useState("");
  const [noteDraft, setNoteDraft] = useState(partnerNotes[id] ?? "");

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg text-[var(--text-muted)]">Hamkor topilmadi</p>
        <Link href="/partners/list" className="text-sm text-[var(--primary)] hover:underline">
          ← Ro&apos;yxatga qaytish
        </Link>
      </div>
    );
  }

  const partnerBookings = mockHotelBookings.slice(0, 8);

  const handleStatusChange = (status: "active" | "suspended" | "blocked") => {
    updatePartnerStatus(id, status);
    toast.success("Hamkor holati yangilandi!");
  };

  const handleDelete = () => {
    if (confirm("Rostdan ham ushbu hamkorni o'chirmoqchimisiz?")) {
      const setPartners = useAdminStore.getState().setPartners;
      setPartners(useAdminStore.getState().partners.filter((p) => p.id !== id));
      toast.success("Hamkor o'chirildi!");
      router.push("/partners/list");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/partners/list"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Hamkorlar ro&apos;yxatiga qaytish
      </Link>

      {/* Profile header */}
      <Card padding="lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl shrink-0"
              style={{
                background: partner.type === "bus"
                  ? "linear-gradient(135deg, #2ECC71, #25A85C)"
                  : partner.type === "restaurant"
                    ? "linear-gradient(135deg, #E67E22, #D35400)"
                    : "linear-gradient(135deg, #1E3A5F, #2B5278)",
              }}
            >
              {partner.type === "bus" ? <Bus size={28} /> :
               partner.type === "hostel" ? <Bed size={28} /> :
               partner.type === "guesthouse" ? <Home size={28} /> :
               partner.type === "dacha" ? <Trees size={28} /> :
               partner.type === "restaurant" ? <UtensilsCrossed size={28} /> :
               <Hotel size={28} />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{partner.companyName}</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                {partner.city} · {partner.contactPerson} · <PartnerTypeDisplay type={partner.type} />
              </p>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={partner.status} statusMap={PARTNER_STATUS_MAP} />
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--warning)]">
                  <Star size={14} className="fill-current" /> {partner.rating.toFixed(1)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">ID: {partner.id}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {partner.status === "active" ? (
              <>
                <Button variant="secondary" size="sm" icon={<Pause size={14} />} onClick={() => handleStatusChange("suspended")}>To&apos;xtatish</Button>
                <Button variant="danger" size="sm" icon={<Ban size={14} />} onClick={() => handleStatusChange("blocked")}>Bloklash</Button>
              </>
            ) : (
              <Button variant="accent" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleStatusChange("active")}>Faollashtirish</Button>
            )}
            <a href={`mailto:${partner.email}`}>
              <Button variant="secondary" size="sm" icon={<Mail size={14} />}>Email</Button>
            </a>
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete}>O&apos;chirish</Button>
          </div>
        </div>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Telefon", value: partner.phone },
          { label: "Email", value: partner.email },
          { label: "Komissiya", value: `${partner.commissionPercent}%`, highlight: true },
          { label: "Ro'yxat sanasi", value: formatDate(partner.createdAt) },
          { label: "Bank", value: partner.bankName ?? "—" },
        ].map((info) => (
          <Card key={info.label} padding="sm">
            <p className="text-xs text-[var(--text-muted)] mb-1">{info.label}</p>
            <div className="flex items-center gap-2">
              <p className={`text-sm font-semibold ${info.highlight ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                {info.value}
              </p>
              {info.highlight && (
                <button
                  onClick={() => {
                    setCommissionInput(partner.commissionPercent.toString());
                    setCommissionModalOpen(true);
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: "bookings",
            label: "Bronlar",
            icon: <CalendarCheck size={16} />,
            count: partner.totalBookings,
            content: (
              <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Bron ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Mijoz</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Sana</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Summa</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {partnerBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{b.id}</td>
                        <td className="px-4 py-3 font-medium">{b.customerName}</td>
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
                  <p className="text-xs text-[var(--text-muted)] mb-1">Umumiy daromad</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{formatPrice(partner.totalRevenue)}</p>
                </Card>
                <Card padding="md">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Komissiya ({partner.commissionPercent}%)</p>
                  <p className="text-lg font-bold text-[var(--accent)]">
                    {formatPrice(Math.floor(partner.totalRevenue * partner.commissionPercent / 100))}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Hamkorga to&apos;langan</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatPrice(Math.floor(partner.totalRevenue * (100 - partner.commissionPercent) / 100))}
                  </p>
                </Card>
              </div>
            ),
          },
          {
            id: "reviews",
            label: "Sharhlar",
            icon: <MessageCircle size={16} />,
            content: (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sharhlar sahifasi keyingi versiyada qo&apos;shiladi</p>
              </div>
            ),
          },
        ]}
      />

      {/* Internal note */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Ichki izoh</p>
          </div>
          {noteDraft !== (partnerNotes[id] ?? "") && (
            <Button
              size="sm"
              onClick={() => {
                setPartnerNote(id, noteDraft);
                toast.success("Izoh saqlandi");
              }}
            >
              Saqlash
            </Button>
          )}
        </div>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Admin izohi yozing (faqat adminlar ko'radi)..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none h-20"
        />
      </Card>

      <Modal
        open={commissionModalOpen}
        onClose={() => setCommissionModalOpen(false)}
        title="Komissiya foizini o'zgartirish"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCommissionModalOpen(false)}>Bekor qilish</Button>
            <Button
              onClick={() => {
                const value = parseFloat(commissionInput);
                if (isNaN(value) || value < 0 || value > 100) {
                  toast.error("0 dan 100 gacha to'g'ri qiymat kiriting");
                  return;
                }
                updatePartnerCommission(id, value);
                toast.success("Komissiya foizi yangilandi!");
                setCommissionModalOpen(false);
              }}
            >
              Saqlash
            </Button>
          </>
        }
      >
        <Input
          type="number"
          label="Komissiya foizi (%)"
          value={commissionInput}
          onChange={(e) => setCommissionInput(e.target.value)}
        />
      </Modal>
    </div>
  );
}
