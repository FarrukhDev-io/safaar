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
import { extractApiErrorMessage, formatDate, formatPrice } from "@/lib/utils";

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? defaultValidUntil() : d.toISOString().slice(0, 10);
}

function makeEmptyForm() {
  return {
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    usageLimit: "100",
    validUntil: defaultValidUntil(),
    isActive: true,
  };
}

export default function PromosPage() {
  const [data, setData] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const openCreate = () => {
    setEditingId(null);
    setForm(makeEmptyForm());
    setModalOpen(true);
  };

  const openEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      usageLimit: String(promo.usageLimit),
      validUntil: toDateInputValue(promo.validUntil),
      isActive: promo.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
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
      if (editingId) {
        await AdminApi.updatePromo(editingId, {
          code,
          discountType: form.discountType,
          discountValue,
          usageLimit: usageLimit > 0 ? usageLimit : 100,
          validUntil: form.validUntil,
          isActive: form.isActive,
        });
        toast.success("Promo-kod yangilandi!");
      } else {
        await AdminApi.createPromo({
          code,
          discountType: form.discountType,
          discountValue,
          usageLimit: usageLimit > 0 ? usageLimit : 100,
          validUntil: form.validUntil,
        });
        toast.success("Promo-kod yaratildi!");
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(makeEmptyForm());
      loadPromos();
    } catch (error) {
      toast.error(
        extractApiErrorMessage(
          error,
          editingId
            ? "Promo-kodni saqlab bo'lmadi. Qaytadan urinib ko'ring."
            : "Promo-kod yaratib bo'lmadi. Qaytadan urinib ko'ring.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo: PromoCode) => {
    if (!confirm(`"${promo.code}" promo-kodini o'chirmoqchimisiz?`)) return;
    setDeletingId(promo.id);
    try {
      await AdminApi.deletePromo(promo.id);
      toast.success("Promo-kod o'chirildi!");
      loadPromos();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Promo-kodni o'chirib bo'lmadi."));
    } finally {
      setDeletingId(null);
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
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10"
            title="Tahrirlash"
            onClick={() => openEdit(row)}
          >
            <Edit2 size={14} />
          </button>
          <button
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50"
            title="O'chirish"
            disabled={deletingId === row.id}
            onClick={() => handleDelete(row)}
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
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          Yangi promo-kod
        </Button>
      </div>
      <DataTable columns={columns} data={data} keyField="id" emptyMessage="Promo-kodlar topilmadi" />

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? "Promo-kodni tahrirlash" : "Yangi promo-kod"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saqlanmoqda..." : editingId ? "Saqlash" : "Yaratish"}
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
          {editingId && (
            <Select
              label="Holat"
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
              options={[
                { value: "active", label: "Faol" },
                { value: "inactive", label: "Nofaol" },
              ]}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
