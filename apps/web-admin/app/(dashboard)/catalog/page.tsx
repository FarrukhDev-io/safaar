"use client";

import { useState } from "react";
import type { CatalogRegion, CatalogAmenity } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Plus, Edit2, Trash2, MapPin, Wifi } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";

export default function CatalogPage() {
  const regions = useAdminStore((s) => s.regions);
  const amenities = useAdminStore((s) => s.amenities);
  const addRegion = useAdminStore((s) => s.addRegion);
  const updateRegion = useAdminStore((s) => s.updateRegion);
  const deleteRegion = useAdminStore((s) => s.deleteRegion);
  const addAmenity = useAdminStore((s) => s.addAmenity);
  const updateAmenity = useAdminStore((s) => s.updateAmenity);
  const deleteAmenity = useAdminStore((s) => s.deleteAmenity);

  const [activeTab, setActiveTab] = useState<"regions" | "amenities">("regions");

  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<CatalogRegion | null>(null);
  const [regionForm, setRegionForm] = useState({ name: "", hotelsCount: 0, isActive: true });

  const [amenityModalOpen, setAmenityModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<CatalogAmenity | null>(null);
  const [amenityForm, setAmenityForm] = useState<{ name: string; icon: string; type: "hotel" | "room"; isActive: boolean }>({
    name: "",
    icon: "",
    type: "hotel",
    isActive: true,
  });

  const openNewRegion = () => {
    setRegionForm({ name: "", hotelsCount: 0, isActive: true });
    setEditingRegion(null);
    setRegionModalOpen(true);
  };

  const openEditRegion = (region: CatalogRegion) => {
    setRegionForm({ name: region.name, hotelsCount: region.hotelsCount, isActive: region.isActive });
    setEditingRegion(region);
    setRegionModalOpen(true);
  };

  const handleSaveRegion = () => {
    if (!regionForm.name.trim()) {
      toast.error("Viloyat/shahar nomini kiriting");
      return;
    }
    if (editingRegion) {
      updateRegion(editingRegion.id, regionForm);
      toast.success("Viloyat/shahar yangilandi!");
    } else {
      addRegion(regionForm);
      toast.success("Yangi viloyat/shahar qo'shildi!");
    }
    setRegionModalOpen(false);
  };

  const handleDeleteRegion = (id: string) => {
    if (confirm("Rostdan ham ushbu viloyat/shaharni o'chirmoqchimisiz?")) {
      deleteRegion(id);
      toast.success("O'chirildi");
    }
  };

  const openNewAmenity = () => {
    setAmenityForm({ name: "", icon: "", type: "hotel", isActive: true });
    setEditingAmenity(null);
    setAmenityModalOpen(true);
  };

  const openEditAmenity = (amenity: CatalogAmenity) => {
    setAmenityForm({ name: amenity.name, icon: amenity.icon, type: amenity.type, isActive: amenity.isActive });
    setEditingAmenity(amenity);
    setAmenityModalOpen(true);
  };

  const handleSaveAmenity = () => {
    if (!amenityForm.name.trim()) {
      toast.error("Qulaylik nomini kiriting");
      return;
    }
    if (editingAmenity) {
      updateAmenity(editingAmenity.id, amenityForm);
      toast.success("Qulaylik yangilandi!");
    } else {
      addAmenity(amenityForm);
      toast.success("Yangi qulaylik qo'shildi!");
    }
    setAmenityModalOpen(false);
  };

  const handleDeleteAmenity = (id: string) => {
    if (confirm("Rostdan ham ushbu qulaylikni o'chirmoqchimisiz?")) {
      deleteAmenity(id);
      toast.success("O'chirildi");
    }
  };

  const regionColumns: Column<CatalogRegion>[] = [
    { key: "id", label: "ID", render: (row) => <span className="text-xs font-mono">{row.id}</span> },
    { key: "name", label: "Viloyat / Shahar", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "hotelsCount", label: "Mehmonxonalar soni", render: (row) => <span className="text-[var(--text-secondary)]">{row.hotelsCount} ta</span> },
    {
      key: "isActive",
      label: "Holat",
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${row.isActive ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--text-muted)]/10 text-[var(--text-secondary)]"}`}>
          {row.isActive ? "Faol" : "Nofaol"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEditRegion(row)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDeleteRegion(row.id)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const amenityColumns: Column<CatalogAmenity>[] = [
    { key: "id", label: "ID", render: (row) => <span className="text-xs font-mono">{row.id}</span> },
    { key: "name", label: "Qulaylik nomi", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "type", label: "Turi", render: (row) => <span className="text-sm text-[var(--text-secondary)]">{row.type === "hotel" ? "Mehmonxona uchun" : "Xona uchun"}</span> },
    {
      key: "isActive",
      label: "Holat",
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${row.isActive ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--text-muted)]/10 text-[var(--text-secondary)]"}`}>
          {row.isActive ? "Faol" : "Nofaol"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEditAmenity(row)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDeleteAmenity(row.id)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10">
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
          <Button size="sm" icon={<Plus size={14} />} onClick={activeTab === "regions" ? openNewRegion : openNewAmenity}>
            Yangi qo'shish
          </Button>
        </div>

        <div className="flex border-b border-[var(--border)] gap-8">
          <button
            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "regions" ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => setActiveTab("regions")}
          >
            <MapPin size={16} />
            Viloyat va Shaharlar
          </button>
          <button
            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "amenities" ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => setActiveTab("amenities")}
          >
            <Wifi size={16} />
            Qulayliklar
          </button>
        </div>

        <div className="mt-2">
          {activeTab === "regions" ? (
            <DataTable columns={regionColumns} data={regions} keyField="id" emptyMessage="Viloyatlar topilmadi" />
          ) : (
            <DataTable columns={amenityColumns} data={amenities} keyField="id" emptyMessage="Qulayliklar topilmadi" />
          )}
        </div>
      </div>

      <Modal
        open={regionModalOpen}
        onClose={() => setRegionModalOpen(false)}
        title={editingRegion ? "Viloyat/shaharni tahrirlash" : "Yangi viloyat/shahar"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRegionModalOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSaveRegion}>Saqlash</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nomi"
            placeholder="Samarqand"
            value={regionForm.name}
            onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
          />
          <Input
            type="number"
            label="Mehmonxonalar soni"
            value={regionForm.hotelsCount.toString()}
            onChange={(e) => setRegionForm({ ...regionForm, hotelsCount: parseInt(e.target.value) || 0 })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={regionForm.isActive}
              onChange={(e) => setRegionForm({ ...regionForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-muted)]">Faol</span>
          </label>
        </div>
      </Modal>

      <Modal
        open={amenityModalOpen}
        onClose={() => setAmenityModalOpen(false)}
        title={editingAmenity ? "Qulaylikni tahrirlash" : "Yangi qulaylik"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAmenityModalOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSaveAmenity}>Saqlash</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nomi"
            placeholder="Bepul Wi-Fi"
            value={amenityForm.name}
            onChange={(e) => setAmenityForm({ ...amenityForm, name: e.target.value })}
          />
          <Input
            label="Ikon nomi (lucide-react)"
            placeholder="Wifi"
            value={amenityForm.icon}
            onChange={(e) => setAmenityForm({ ...amenityForm, icon: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Turi</label>
            <select
              value={amenityForm.type}
              onChange={(e) => setAmenityForm({ ...amenityForm, type: e.target.value as "hotel" | "room" })}
              className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="hotel">Mehmonxona uchun</option>
              <option value="room">Xona uchun</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={amenityForm.isActive}
              onChange={(e) => setAmenityForm({ ...amenityForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-muted)]">Faol</span>
          </label>
        </div>
      </Modal>
    </>
  );
}
