"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { CmsBanner } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Plus, Edit2, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";
import { AdminApi } from "@/lib/api/admin-api";

function hasRenderableImage(value: string) {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}

function BannerImage({
  src,
  title,
  className = "",
}: {
  src: string;
  title: string;
  className?: string;
}) {
  if (hasRenderableImage(src)) {
    return (
      <Image
        src={src}
        alt={title}
        fill
        unoptimized
        sizes="100vw"
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary)]/15 via-white to-[var(--accent)]/15 px-2 text-center text-[10px] font-semibold text-[var(--primary)]">
      {title || "Banner"}
    </div>
  );
}

export default function CmsBannersPage() {
  const banners = useAdminStore((s) => s.cmsBanners);
  const setCmsBanners = useAdminStore((s) => s.setCmsBanners);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CmsBanner | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    link: "",
    imageUrl: "",
    order: 1,
    isActive: true,
  });

  useEffect(() => {
    AdminApi.getCmsBanners()
      .then((items) => setCmsBanners(items))
      .finally(() => setLoading(false));
  }, [setCmsBanners]);

  const openNewModal = () => {
    setFormData({ title: "", link: "", imageUrl: "", order: banners.length + 1, isActive: true });
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: CmsBanner) => {
    setFormData({
      title: banner.title,
      link: banner.link,
      imageUrl: banner.imageUrl,
      order: banner.order,
      isActive: banner.isActive,
    });
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.link || !formData.imageUrl) {
      toast.error("Iltimos barcha maydonlarni to'ldiring");
      return;
    }

    if (editingBanner) {
      const updated = await AdminApi.updateCmsBanner(editingBanner.id, formData);
      setCmsBanners(banners.map((banner) => banner.id === updated.id ? updated : banner));
      toast.success("Banner muvaffaqiyatli saqlandi!");
    } else {
      const created = await AdminApi.createCmsBanner(formData);
      setCmsBanners([...banners, created].sort((a, b) => a.order - b.order));
      toast.success("Yangi banner qo'shildi!");
    }
    setIsModalOpen(false);
  };

  const handleToggle = async (banner: CmsBanner) => {
    const updated = await AdminApi.setCmsBannerActive(banner.id, !banner.isActive);
    setCmsBanners(banners.map((item) => item.id === updated.id ? updated : item));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Rostdan ham ushbu bannerni o'chirmoqchimisiz?")) {
      await AdminApi.deleteCmsBanner(id);
      setCmsBanners(banners.filter((banner) => banner.id !== id));
      toast.success("Banner o'chirildi");
    }
  };

  const columns: Column<CmsBanner>[] = [
    { key: "order", label: "Tartib", render: (row) => <span className="font-medium text-lg">{row.order}</span> },
    { key: "imageUrl", label: "Rasm", render: (row) => <div className="relative w-24 h-12 bg-[var(--bg-tertiary)] rounded overflow-hidden" title={row.imageUrl}><BannerImage src={row.imageUrl} title={row.title} /></div> },
    { key: "title", label: "Sarlavha", render: (row) => <span className="font-medium">{row.title}</span> },
    { key: "link", label: "Havola (Link)", render: (row) => <span className="text-sm text-[var(--primary)] underline">{row.link}</span> },
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
          <button onClick={() => handleToggle(row)} title={row.isActive ? "Nofaol qilish" : "Faol qilish"} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${row.isActive ? "text-[var(--warning)] hover:bg-[var(--warning)]/10" : "text-[var(--success)] hover:bg-[var(--success)]/10"}`}>
            <Power size={14} />
          </button>
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
        <div className="flex justify-end">
          <Button size="sm" icon={<Plus size={14} />} onClick={openNewModal}>Yangi Banner</Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={banners} keyField="id" emptyMessage="Bannerlar topilmadi" />
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? "Bannerni tahrirlash" : "Yangi Banner"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSave}>Saqlash</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input 
            label="Sarlavha" 
            placeholder="Katta chegirmalar..." 
            value={formData.title} 
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
          />
          <Input
            label="Rasm URL"
            placeholder="https://cdn.safaar.uz/banners/..."
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
          <Input 
            label="Yo'naltirish havolasi (Link)" 
            placeholder="/hotels?discount=true" 
            value={formData.link} 
            onChange={(e) => setFormData({ ...formData, link: e.target.value })} 
          />
          <Input 
            type="number"
            label="Tartib raqami" 
            value={formData.order.toString()} 
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} 
          />
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Holat</label>
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
        </div>
      </Modal>
    </>
  );
}
