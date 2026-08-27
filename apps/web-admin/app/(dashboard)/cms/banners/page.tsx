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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const bannerSchema = z.object({
  title: z.string().min(2, "Kamida 2 ta belgi kiriting"),
  link: z.string().min(1, "Havolani kiriting"),
  imageUrl: z.string().min(5, "Rasm havolasini kiriting").url("Noto'g'ri havola formati (http:// yoki https:// dan boshlanishi kerak)"),
  order: z.number({ required_error: "Tartib raqamini kiriting", invalid_type_error: "Faqat raqam kiriting" }).int().min(1, "Kamida 1 bo'lishi kerak"),
  isActive: z.boolean(),
});
type BannerFormValues = z.infer<typeof bannerSchema>;

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
  const [error, setError] = useState(false);

  const fetchBanners = () => {
    setLoading(true);
    setError(false);
    AdminApi.getCmsBanners()
      .then((items) => setCmsBanners(items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CmsBanner | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      link: "",
      imageUrl: "",
      order: 1,
      isActive: true,
    }
  });

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setLoading(true);
      setError(false);
      AdminApi.getCmsBanners()
        .then((items) => {
          if (!cancelled) setCmsBanners(items);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    return () => { cancelled = true; };
  }, [setCmsBanners]);

  const openNewModal = () => {
    form.reset({ title: "", link: "", imageUrl: "", order: banners.length + 1, isActive: true });
    setEditingBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: CmsBanner) => {
    form.reset({
      title: banner.title,
      link: banner.link,
      imageUrl: banner.imageUrl,
      order: banner.order,
      isActive: banner.isActive,
    });
    setEditingBanner(banner);
    setIsModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      if (editingBanner) {
        const updated = await AdminApi.updateCmsBanner(editingBanner.id, values);
        setCmsBanners(banners.map((banner) => banner.id === updated.id ? updated : banner));
        toast.success("Banner muvaffaqiyatli saqlandi!");
      } else {
        const created = await AdminApi.createCmsBanner(values);
        setCmsBanners([...banners, created].sort((a, b) => a.order - b.order));
        toast.success("Yangi banner qo'shildi!");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Bannerni saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  });

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
        
        <DataTable 
          columns={columns} 
          data={banners} 
          keyField="id" 
          emptyMessage="Bannerlar topilmadi" 
          isLoading={loading}
          isError={error}
          onRetry={fetchBanners}
        />
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? "Bannerni tahrirlash" : "Yangi Banner"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>Bekor qilish</Button>
            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Input 
              label="Sarlavha" 
              placeholder="Katta chegirmalar..." 
              {...form.register("title")} 
            />
            {form.formState.errors.title && <span className="text-xs text-red-500">{form.formState.errors.title.message}</span>}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <Input
              label="Rasm URL"
              placeholder="https://cdn.safaar.uz/banners/..."
              {...form.register("imageUrl")}
            />
            {form.formState.errors.imageUrl && <span className="text-xs text-red-500">{form.formState.errors.imageUrl.message}</span>}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <Input 
              label="Yo'naltirish havolasi (Link)" 
              placeholder="/hotels?discount=true" 
              {...form.register("link")} 
            />
            {form.formState.errors.link && <span className="text-xs text-red-500">{form.formState.errors.link.message}</span>}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <Input 
              type="number"
              label="Tartib raqami" 
              {...form.register("order", { valueAsNumber: true })} 
            />
            {form.formState.errors.order && <span className="text-xs text-red-500">{form.formState.errors.order.message}</span>}
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Holat</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <input 
                    type="checkbox" 
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                )}
              />
              <span className="text-sm text-[var(--text-muted)]">Faol</span>
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
