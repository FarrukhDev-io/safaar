"use client";

import { useState, useEffect } from "react";
import { AdminApi } from "@/lib/api/admin-api";
import type { CatalogRegion, CatalogAmenity } from "@/types/admin";
import DataTable from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import { Plus, Edit2, Trash2, MapPin, Wifi } from "lucide-react";

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<"regions" | "amenities">("regions");
  const [regions, setRegions] = useState<CatalogRegion[]>([]);
  const [amenities, setAmenities] = useState<CatalogAmenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([AdminApi.getRegions(), AdminApi.getAmenities()]).then(([reg, amen]) => {
      setRegions(reg);
      setAmenities(amen);
      setLoading(false);
    });
  }, []);

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
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="w-8 h-8 rounded flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10">
            <Edit2 size={14} />
          </button>
          <button className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10">
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
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="w-8 h-8 rounded flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary)]/10">
            <Edit2 size={14} />
          </button>
          <button className="w-8 h-8 rounded flex items-center justify-center text-[var(--danger)] hover:bg-[var(--danger)]/10">
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
        
        <Button size="sm" icon={<Plus size={14} />}>
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
  );
}
