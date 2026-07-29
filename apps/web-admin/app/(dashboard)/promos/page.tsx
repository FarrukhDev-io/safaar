"use client";

import { useState } from "react";
import type { PromoCode } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/utils";
import { useAdminStore } from "@/lib/store";

const emptyForm = {
  code: "",
  discountType: "percent" as "percent" | "fixed",
  discountValue: 0,
  usageLimit: 100,
  validUntil: "",
  isActive: true,
};

export default function PromosPage() {
  const data = useAdminStore((s) => s.promoCodes);
  const addPromo = useAdminStore((s) => s.addPromo);
  const updatePromo = useAdminStore((s) => s.updatePromo);
  const deletePromo = useAdminStore((s) => s.deletePromo);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const openNewModal = () => {
    setFormData(emptyForm);
    setEditingPromo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      usageLimit: promo.usageLimit,
      validUntil: promo.validUntil.slice(0, 10),
      isActive: promo.isActive,
    });
    setEditingPromo(promo);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code.trim() || !formData.validUntil || formData.discountValue <= 0) {
      toast.error("Iltimos barcha maydonlarni to'ldiring");
      return;
    }
    const payload = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      validUntil: new Date(formData.validUntil).toISOString(),
    };
    if (editingPromo) {
      updatePromo(editingPromo.id, payload);
      toast.success("Promo-kod yangilandi!");
    } else {
      addPromo(payload);
      toast.success("Yangi promo-kod qo'shildi!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Rostdan ham ushbu promo-kodni o'chirmoqchimisiz?")) {
      deletePromo(id);
      toast.success("Promo-kod o'chirildi");
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
          <button onClick={() => openEditModal(row)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div />
          <Button size="sm" icon={<Plus size={14} />} onClick={openNewModal}>Yangi promo-kod</Button>
        </div>
        <DataTable columns={columns} data={data} keyField="id" emptyMessage="Promo-kodlar topilmadi" />
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPromo ? "Promo-kodni tahrirlash" : "Yangi promo-kod"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave}>Saqlash</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Promo-kod"
            placeholder="SUMMER20"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Chegirma turi</label>
            <select
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percent" | "fixed" })}
              className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="percent">Foiz (%)</option>
              <option value="fixed">Aniq summa (so'm)</option>
            </select>
          </div>
          <Input
            type="number"
            label={formData.discountType === "percent" ? "Chegirma foizi" : "Chegirma summasi (so'm)"}
            value={formData.discountValue.toString()}
            onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
          />
          <Input
            type="number"
            label="Foydalanish limiti"
            value={formData.usageLimit.toString()}
            onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
          />
          <Input
            type="date"
            label="Amal qilish muddati"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-muted)]">Faol</span>
          </label>
        </div>
      </Modal>
    </>
  );
}
