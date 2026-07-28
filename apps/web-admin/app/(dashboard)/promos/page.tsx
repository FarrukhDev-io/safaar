"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { AdminApi } from "@/lib/api/admin-api";
import type { PromoCode } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    const message = data?.error?.message ?? data?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function makeEmptyForm() {
  return {
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    usageLimit: "100",
    validUntil: defaultValidUntil(),
  };
}

export default function PromosPage() {
  const [data, setData] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(makeEmptyForm);

  const loadPromos = useCallback(() => {
    AdminApi.getPromos()
      .then((res) => setData(res))
      .catch(() => toast.error("Promo-kodlarni yuklab bo'lmadi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  const handleCreate = async () => {
    const code = form.code.trim();
    const discountValue = Number(form.discountValue);
    const usageLimit = Number(form.usageLimit);

    if (!code) {
      toast.error("Promo-kod nomini kiriting.");
      return;
    }
    if (!discountValue || discountValue <= 0) {
      toast.error("Chegirma qiymatini kiriting.");
      return;
    }

    setSaving(true);
    try {
      await AdminApi.createPromo({
        code,
        discountType: form.discountType,
        discountValue,
        usageLimit: usageLimit > 0 ? usageLimit : 100,
        validUntil: form.validUntil,
      });
      toast.success("Promo-kod yaratildi!");
      setCreateOpen(false);
      setForm(makeEmptyForm());
      loadPromos();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Promo-kod yaratib bo'lmadi. Qaytadan urinib ko'ring."),
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<PromoCode>[] = [
    { key: "code", label: "Promo-kod", render: (row) => <span className="font-bold text-lg tracking-widest bg-[var(--bg-tertiary)] px-2 py-1 rounded">{row.code}</span> },
    { key: "discountValue", label: "Chegirma", render: (row) => <span className="font-medium text-[var(--accent)]">{row.discountType === "percent" ? `${row.discountValue}%` : formatPrice(row.discountValue)}</span> },
    { key: "usageLimit", label: "Foydalanish (ishlatildi / limit)", render: (row) => <span className="text-sm text-[var(--text-secondary)]">{row.usedCount} / {row.usageLimit}</span> },
    { key: "validUntil", label: "Amal qilish muddati", render: (row) => <span className="text-sm">{formatDate(row.validUntil)}</span> },
    {
      key: "isActive",
      label: "Holat",
      render: (row) => {
        const isExpired = new Date(row.validUntil).getTime() < Date.now();
        if (isExpired) {
          return <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--danger)]/10 text-[var(--danger)]">Muddati o'tgan</span>;
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${row.isActive ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--text-muted)]/10 text-[var(--text-secondary)]"}`}>
            {row.isActive ? "Faol" : "Nofaol"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: () => (
        <div className="flex justify-end gap-2">
          <button
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-muted)] cursor-not-allowed"
            title="Tahrirlash hozircha qo'llab-quvvatlanmaydi"
            disabled
          >
            <Edit2 size={14} />
          </button>
          <button
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-muted)] cursor-not-allowed"
            title="O'chirish hozircha qo'llab-quvvatlanmaydi"
            disabled
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center p-12"><span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
          Yangi promo-kod
        </Button>
      </div>
      <DataTable columns={columns} data={data} keyField="id" emptyMessage="Promo-kodlar topilmadi" />

      <Modal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="Yangi promo-kod"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Yaratish"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Promo-kod"
            placeholder="SUMMER20"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Chegirma turi"
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value as "percent" | "fixed" })
              }
              options={[
                { value: "percent", label: "Foiz (%)" },
                { value: "fixed", label: "So'm (belgilangan summa)" },
              ]}
            />
            <Input
              label={form.discountType === "percent" ? "Chegirma (%)" : "Chegirma (so'm)"}
              type="number"
              min={1}
              placeholder={form.discountType === "percent" ? "20" : "50000"}
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            />
          </div>
          <Input
            label="Foydalanish limiti"
            type="number"
            min={1}
            placeholder="100"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
          />
          <Input
            label="Amal qilish muddati"
            type="date"
            value={form.validUntil}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
