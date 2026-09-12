"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Edit2, Plus, Send, FileText, Trash2 } from "lucide-react";
import type { CmsArticle } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

type CmsArticleKind = CmsArticle["type"];
type ManagedArticle = CmsArticle & {
  body?: string;
};

interface CmsArticleManagerProps {
  type: CmsArticleKind;
  title: string;
  addLabel: string;
  emptyMessage: string;
  loadItems: () => Promise<CmsArticle[]>;
}

const TYPE_PREFIX: Record<CmsArticleKind, string> = {
  news: "N",
  offer: "O",
  page: "P",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9а-яёғқҳўүӣҷ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function defaultBody(item: CmsArticle) {
  if (item.type === "page") {
    return `${item.title} sahifasi uchun matn. Bu joyda foydalanuvchilarga ko'rinadigan asosiy kontent yoziladi.`;
  }
  if (item.type === "offer") {
    return `${item.title} bo'yicha maxsus taklif tafsilotlari. Aksiya shartlari, muddatlari va foydalanuvchi uchun foydasi shu yerda yoziladi.`;
  }
  return `${item.title} haqida yangilik matni. Platformadagi o'zgarishlar va foydalanuvchilar uchun muhim ma'lumotlar shu yerda yoziladi.`;
}

function makeDraft(type: CmsArticleKind): ManagedArticle {
  return {
    id: `${TYPE_PREFIX[type]}-${Date.now().toString().slice(-6)}`,
    title: "",
    type,
    slug: "",
    status: "draft",
    publishedAt: "",
    body: "",
  };
}

export function CmsArticleManager({
  type,
  title,
  addLabel,
  emptyMessage,
  loadItems,
}: CmsArticleManagerProps) {
  const [items, setItems] = useState<ManagedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ManagedArticle | null>(null);
  const [previewItem, setPreviewItem] = useState<ManagedArticle | null>(null);

  useEffect(() => {
    let mounted = true;
    loadItems()
      .then((result) => {
        if (!mounted) return;
        setItems(
          result
            .filter((item) => item.type === type)
            .map((item) => ({ ...item, body: defaultBody(item) })),
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [loadItems, type]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        (b.publishedAt || b.id).localeCompare(a.publishedAt || a.id),
      ),
    [items],
  );

  const openCreate = () => setEditingItem(makeDraft(type));
  const openEdit = (item: ManagedArticle) => setEditingItem({ ...item });
  const openPreview = (item: ManagedArticle) => setPreviewItem(item);

  const saveItem = () => {
    if (!editingItem) return;

    const titleValue = editingItem.title.trim();
    const bodyValue = editingItem.body?.trim() ?? "";
    const slugValue = slugify(editingItem.slug || titleValue);

    if (!titleValue || !slugValue || !bodyValue) {
      toast.error("Sarlavha, slug va kontent matnini to'ldiring");
      return;
    }

    const next: ManagedArticle = {
      ...editingItem,
      title: titleValue,
      slug: slugValue,
      body: bodyValue,
      publishedAt:
        editingItem.status === "published"
          ? editingItem.publishedAt || new Date().toISOString()
          : "",
    };

    setItems((current) => {
      const exists = current.some((item) => item.id === next.id);
      return exists
        ? current.map((item) => (item.id === next.id ? next : item))
        : [next, ...current];
    });

    setEditingItem(null);
    toast.success("Kontent saqlandi");
  };

  const toggleStatus = (item: ManagedArticle) => {
    const nextStatus = item.status === "published" ? "draft" : "published";
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: nextStatus,
              publishedAt:
                nextStatus === "published" ? new Date().toISOString() : "",
            }
          : entry,
      ),
    );
    toast.success(
      nextStatus === "published" ? "Kontent chop etildi" : "Kontent qoralamaga o'tkazildi",
    );
  };

  const deleteItem = (item: ManagedArticle) => {
    if (!confirm(`"${item.title}" o'chirilsinmi?`)) return;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    toast.success("Kontent o'chirildi");
  };

  const columns: Column<ManagedArticle>[] = [
    {
      key: "id",
      label: "ID",
      render: (row) => <span className="text-xs font-mono">{row.id}</span>,
    },
    {
      key: "title",
      label: "Sarlavha",
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: "slug",
      label: "Slug (URL)",
      render: (row) => (
        <span className="text-sm text-[var(--text-muted)]">/{row.slug}</span>
      ),
    },
    {
      key: "status",
      label: "Holat",
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            row.status === "published"
              ? "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
              : "bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)]/20"
          }`}
        >
          {row.status === "published" ? "Chop etilgan" : "Qoralama"}
        </button>
      ),
    },
    {
      key: "publishedAt",
      label: "Sana",
      render: (row) => (
        <span className="text-sm">
          {row.publishedAt ? formatDate(row.publishedAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openPreview(row)}
            title="Ko'rish"
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            onClick={() => openEdit(row)}
            title="Tahrirlash"
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => deleteItem(row)}
            title="O'chirish"
            className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
            {addLabel}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={sortedItems}
          keyField="id"
          emptyMessage={emptyMessage}
        />
      </div>

      <Modal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title ?? "Kontent"}
        size="lg"
        footer={
          <>
            {previewItem ? (
              <Button variant="secondary" onClick={() => {
                setEditingItem({ ...previewItem });
                setPreviewItem(null);
              }}>
                Tahrirlash
              </Button>
            ) : null}
            <Button onClick={() => setPreviewItem(null)}>Yopish</Button>
          </>
        }
      >
        {previewItem ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <FileText size={16} />
                /{previewItem.slug}
              </div>
              <h3 className="mt-3 text-xl font-bold text-[var(--text-primary)]">
                {previewItem.title}
              </h3>
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
              {previewItem.body || defaultBody(previewItem)}
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={editingItem?.title ? "Kontentni tahrirlash" : "Yangi kontent"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingItem(null)}>
              Bekor qilish
            </Button>
            <Button icon={<Send size={14} />} onClick={saveItem}>
              Saqlash
            </Button>
          </>
        }
      >
        {editingItem ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Sarlavha"
              value={editingItem.title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setEditingItem({
                  ...editingItem,
                  title: nextTitle,
                  slug: editingItem.slug || slugify(nextTitle),
                });
              }}
            />
            <Input
              label="Slug"
              value={editingItem.slug}
              onChange={(event) =>
                setEditingItem({ ...editingItem, slug: slugify(event.target.value) })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Holat
                </span>
                <select
                  value={editingItem.status}
                  onChange={(event) =>
                    setEditingItem({
                      ...editingItem,
                      status: event.target.value as CmsArticle["status"],
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  <option value="draft">Qoralama</option>
                  <option value="published">Chop etilgan</option>
                </select>
              </label>
              <Input
                label="URL preview"
                value={`/${editingItem.slug || slugify(editingItem.title)}`}
                readOnly
              />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Kontent matni
              </span>
              <textarea
                value={editingItem.body ?? ""}
                onChange={(event) =>
                  setEditingItem({ ...editingItem, body: event.target.value })
                }
                rows={8}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                placeholder="Matnni kiriting..."
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
