"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { Mail, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type TemplateType = "email" | "sms";

interface CmsTemplate {
  id: string;
  name: string;
  type: TemplateType;
  code: string;
  description: string;
  subject: string;
  body: string;
  isActive: boolean;
  variables: string[];
  updatedAt: string;
}

type ApiRecord = Record<string, unknown>;

const emptyDraft: Omit<CmsTemplate, "id" | "updatedAt"> = {
  name: "",
  type: "sms",
  code: "",
  description: "",
  subject: "",
  body: "",
  isActive: false,
  variables: [],
};

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function items(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  return [];
}

function variablesIn(text: string): string[] {
  const matches = text.match(/\{([a-zA-Z0-9_]+)\}/g);
  return matches ? Array.from(new Set(matches.map((m) => m.slice(1, -1)))) : [];
}

function templateFromRow(value: unknown): CmsTemplate {
  const row = isRecord(value) ? value : {};
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const type = metadata.type === "email" ? "email" : "sms";
  const body = String(row.body ?? "");
  const parsedVars = variablesIn(body);
  const metadataVars = Array.isArray(metadata.variables)
    ? metadata.variables.map(String)
    : [];

  return {
    id: String(row.id ?? ""),
    name: String(row.title ?? ""),
    type,
    code: String(metadata.code ?? row.slug ?? ""),
    description: String(metadata.description ?? ""),
    subject: String(metadata.subject ?? ""),
    body,
    isActive: row.status === "published" || row.status === "active",
    variables: metadataVars.length > 0 ? metadataVars : parsedVars,
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ""),
  };
}

async function fetchTemplates(): Promise<CmsTemplate[]> {
  const { data } = await apiClient.get("/admin/cms/templates");
  return items(data).map(templateFromRow);
}

function payload(template: Omit<CmsTemplate, "id" | "updatedAt">) {
  const variables = variablesIn(template.body);
  return {
    slug: template.code,
    title: { uz: template.name },
    body: { uz: template.body },
    metadata: {
      code: template.code,
      type: template.type,
      description: template.description,
      subject: template.subject,
      variables,
    },
  };
}

export default function CmsTemplatesPage() {
  const [templates, setTemplates] = useState<CmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | TemplateType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);

  const load = async () => {
    setLoading(true);
    try {
      setTemplates(await fetchTemplates());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchTemplates()
      .then((data) => {
        if (active) setTemplates(data);
      })
      .catch((error) => {
        console.error("Failed to load CMS templates", error);
        toast.error("Shablonlarni yuklashda xatolik yuz berdi");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesType = activeTab === "all" || template.type === activeTab;
      const matchesSearch =
        !needle ||
        template.name.toLowerCase().includes(needle) ||
        template.code.toLowerCase().includes(needle);
      return matchesType && matchesSearch;
    });
  }, [activeTab, searchTerm, templates]);

  const startEdit = (template: CmsTemplate) => {
    setEditingId(template.id);
    setDraft({
      name: template.name,
      type: template.type,
      code: template.code,
      description: template.description,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
      variables: template.variables,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.code.trim() || !draft.body.trim()) {
      toast.error("Nomi, kodi va matnini to'ldiring");
      return;
    }

    if (editingId) {
      await apiClient.patch(`/admin/cms/templates/${editingId}`, payload(draft));
      await apiClient.post(
        `/admin/cms/templates/${editingId}/${draft.isActive ? "publish" : "unpublish"}`,
      );
      toast.success("Shablon yangilandi");
    } else {
      const { data } = await apiClient.post("/admin/cms/templates", payload(draft));
      const id = String(data.id ?? "");
      if (id && draft.isActive) {
        await apiClient.post(`/admin/cms/templates/${id}/publish`);
      }
      toast.success("Shablon yaratildi");
    }

    resetForm();
    await load();
  };

  const toggleActive = async (template: CmsTemplate) => {
    await apiClient.post(
      `/admin/cms/templates/${template.id}/${template.isActive ? "unpublish" : "publish"}`,
    );
    await load();
  };

  const archive = async (template: CmsTemplate) => {
    if (!confirm("Haqiqatan ham ushbu shablonni arxivlaysizmi?")) return;
    await apiClient.post(`/admin/cms/templates/${template.id}/archive`);
    await load();
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <Input
            placeholder="Shablon nomi yoki kodi"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value as "all" | TemplateType)}
            className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="all">Barchasi</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
          <Button variant="accent" onClick={resetForm}>
            Yangi shablon
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            placeholder="Nomi"
            value={draft.name}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            placeholder="Kod"
            value={draft.code}
            onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))}
          />
          <select
            value={draft.type}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, type: event.target.value as TemplateType }))
            }
            className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
          <Input
            placeholder="Email mavzusi"
            value={draft.subject}
            onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
          />
          <Input
            placeholder="Izoh"
            value={draft.description}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, description: event.target.value }))
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Faol
          </label>
          <textarea
            className="min-h-40 rounded-lg border border-[var(--border)] p-3 text-sm lg:col-span-2"
            placeholder="Matn. O'zgaruvchilarni {customerName} shaklida yozing."
            value={draft.body}
            onChange={(event) => {
              const body = event.target.value;
              setDraft((prev) => ({ ...prev, body, variables: variablesIn(body) }));
            }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--text-muted)]">
            O'zgaruvchilar: {variablesIn(draft.body).map((v) => `{${v}}`).join(", ") || "-"}
          </span>
          <Button variant="accent" onClick={() => void save()}>
            {editingId ? "Yangilash" : "Saqlash"}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
              <th className="px-4 py-3 text-left">Shablon</th>
              <th className="px-4 py-3 text-left">Tur</th>
              <th className="px-4 py-3 text-left">O'zgaruvchilar</th>
              <th className="px-4 py-3 text-left">Holat</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-[var(--text-muted)]" colSpan={5}>
                  Yuklanmoqda...
                </td>
              </tr>
            ) : filteredTemplates.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[var(--text-muted)]" colSpan={5}>
                  Shablon topilmadi
                </td>
              </tr>
            ) : (
              filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-[var(--bg-tertiary)]/50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{template.name}</span>
                      <span className="font-mono text-xs text-[var(--primary)]">{template.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      {template.type === "email" ? <Mail size={14} /> : <MessageSquare size={14} />}
                      {template.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {template.variables.map((variable) => `{${variable}}`).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void toggleActive(template)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        template.isActive
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {template.isActive ? "Faol" : "Nofaol"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(template)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void archive(template)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
