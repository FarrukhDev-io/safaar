"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../_components/layout/page-header";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Label } from "../../_components/ui/label";
import { useDachaDetails, useUpdateDachaDetails, type DachaDetails } from "../../_hooks/use-dacha-details";

const TOGGLES: Array<{ key: keyof DachaDetails; label: string; description: string }> = [
  { key: "hasOutdoorPool", label: "Ochiq basseyn", description: "Hovlida yozgi basseyn" },
  { key: "hasIndoorPool", label: "Yopiq (isitiladigan) basseyn", description: "Yil davomida ishlaydigan basseyn" },
  { key: "hasSauna", label: "Sauna / hammom", description: "Fin saunasi yoki Turk hammomi" },
  { key: "hasPlaystation", label: "PlayStation", description: "O'yin pristavkasi mavjud" },
  { key: "hasBilliards", label: "Bilyard", description: "Bilyard stoli mavjud" },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="peer h-5 w-9 rounded-full bg-zinc-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600" />
    </label>
  );
}

export function DachaDetailsView() {
  const { data, isLoading } = useDachaDetails();
  const update = useUpdateDachaDetails();
  const [draft, setDraft] = useState<DachaDetails>(data);
  const [prevData, setPrevData] = useState<DachaDetails>(data);

  // Server javobi (`data`) o'zgarganda `draft`ni moslashtirish — render
  // paytida, effect ichida emas (React'ning "props o'zgarganda state'ni
  // moslashtirish" rasmiy naqshi), aks holda kaskad render yuzaga keladi.
  if (!isLoading && JSON.stringify(data) !== JSON.stringify(prevData)) {
    setPrevData(data);
    setDraft(data);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);

  const onSave = async () => {
    try {
      await update.mutateAsync(draft);
      toast.success("Dacha ma'lumotlari saqlandi");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ma'lumotlarni saqlab bo'lmadi",
      );
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 pb-10">
      <PageHeader
        eyebrow="Operatsion"
        title="Dacha Ma'lumotlari"
        description="Dacha xususiyatlari va parametrlarini boshqaring."
      />

      <section className="flex flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
          Asosiy parametrlar
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="landAreaSotix">Hovli maydoni (sotix)</Label>
            <Input
              id="landAreaSotix"
              type="number"
              min={0}
              placeholder="Masalan: 6"
              value={draft.landAreaSotix ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  landAreaSotix: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="capacityPeople">Sig'imi (necha kishiga)</Label>
            <Input
              id="capacityPeople"
              type="number"
              min={0}
              placeholder="Masalan: 12"
              value={draft.capacityPeople ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  capacityPeople: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Narxi (1 kechaga)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              placeholder="Masalan: 300000"
              value={draft.price ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  price: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              disabled={isLoading}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-zinc-500">
          Ko'ngilochar xususiyatlar
        </h2>

        <div className="flex flex-col divide-y divide-[var(--border)]">
          {TOGGLES.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{label}</p>
                <p className="text-xs text-zinc-500">{description}</p>
              </div>
              <Toggle
                checked={Boolean(draft[key])}
                disabled={isLoading}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, [key]: value }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={!dirty || update.isPending || isLoading}>
          {update.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
}
