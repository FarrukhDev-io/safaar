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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? defaultValidUntil() : d.toISOString().slice(0, 10);
}

const promoSchema = z.object({
  code: z.string().min(3, "Kamida 3 ta belgi").max(20, "20 ta belgidan oshmasin").trim().toUpperCase(),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number({ required_error: "Miqdorni kiriting", invalid_type_error: "Faqat raqam kiriting" }).min(1, "Noldan katta bo'lishi kerak"),
  usageLimit: z.number({ required_error: "Limitni kiriting", invalid_type_error: "Faqat raqam kiriting" }).min(1, "Kamida 1 bo'lishi kerak"),
  validUntil: z.string().min(1, "Sanani kiriting"),
  isActive: z.boolean(),
});

type PromoFormValues = z.infer<typeof promoSchema>;

export default function PromosPage() {
  const [data, setData] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<PromoFormValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      code: "",
      discountType: "percent",
      discountValue: undefined,
      usageLimit: 100,
      validUntil: defaultValidUntil(),
      isActive: true,
    }
  });

  const loadPromos = useCallback(() => {
    setLoading(true);
    setError(false);
    AdminApi.getPromos()
      .then((res) => setData(res))
      .catch(() => {
        toast.error("Promo-kodlarni yuklab bo'lmadi.");
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    AdminApi.getPromos()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Promo-kodlarni yuklab bo'lmadi.");
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.reset({
      code: "",
      discountType: "percent",
      discountValue: undefined as any,
      usageLimit: 100,
      validUntil: defaultValidUntil(),
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    form.reset({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      usageLimit: promo.usageLimit,
      validUntil: toDateInputValue(promo.validUntil),
      isActive: promo.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      if (editingId) {
        await AdminApi.updatePromo(editingId, values);
        toast.success("Promo-kod yangilandi!");
      } else {
        await AdminApi.createPromo(values);
        toast.success("Promo-kod yaratildi!");
      }
      setModalOpen(false);
      setEditingId(null);
      form.reset();
      loadPromos();
    } catch (error) {
      toast.error(
        extractApiErrorMessage(
          error,
          editingId
            ? "Promo-kodni saqlab bo'lmadi. Qaytadan urinib ko'ring."
            : "Promo-kod yaratib bo'lmadi. Qaytadan urinib ko'ring."
        )
      );
    } finally {
      setSaving(false);
    }
  });

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



  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          Yangi promo-kod
        </Button>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        keyField="id" 
        emptyMessage="Promo-kodlar topilmadi" 
        isLoading={loading}
        isError={error}
        onRetry={loadPromos}
      />

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? "Promo-kodni tahrirlash" : "Yangi promo-kod"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={saving}>
              {saving ? "Saqlanmoqda..." : editingId ? "Saqlash" : "Yaratish"}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Promo-kod"
              placeholder="SUMMER20"
              {...form.register("code")}
              onChange={(e) => {
                form.setValue("code", e.target.value.toUpperCase(), { shouldValidate: true });
              }}
            />
            {form.formState.errors.code && <span className="text-xs text-red-500">{form.formState.errors.code.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Controller
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <Select
                    label="Chegirma turi"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    options={[
                      { value: "percent", label: "Foiz (%)" },
                      { value: "fixed", label: "So'm (belgilangan summa)" },
                    ]}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Input
                label={form.watch("discountType") === "percent" ? "Chegirma (%)" : "Chegirma (so'm)"}
                type="number"
                min={1}
                placeholder={form.watch("discountType") === "percent" ? "20" : "50000"}
                {...form.register("discountValue", { valueAsNumber: true })}
              />
              {form.formState.errors.discountValue && <span className="text-xs text-red-500">{form.formState.errors.discountValue.message}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Foydalanish limiti"
              type="number"
              min={1}
              placeholder="100"
              {...form.register("usageLimit", { valueAsNumber: true })}
            />
            {form.formState.errors.usageLimit && <span className="text-xs text-red-500">{form.formState.errors.usageLimit.message}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Amal qilish muddati"
              type="date"
              {...form.register("validUntil")}
            />
            {form.formState.errors.validUntil && <span className="text-xs text-red-500">{form.formState.errors.validUntil.message}</span>}
          </div>
          {editingId && (
            <div className="flex flex-col gap-1.5">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Select
                    label="Holat"
                    value={field.value ? "active" : "inactive"}
                    onChange={(e) => field.onChange(e.target.value === "active")}
                    options={[
                      { value: "active", label: "Faol" },
                      { value: "inactive", label: "Nofaol" },
                    ]}
                  />
                )}
              />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
