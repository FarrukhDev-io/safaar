"use client";

import { Baby, Cigarette, Dog, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../../../_components/ui/button";
import { Drawer } from "../../../_components/ui/drawer";
import { EmptyState } from "../../../_components/ui/empty-state";
import { Input } from "../../../_components/ui/input";
import { Label } from "../../../_components/ui/label";
import { Tooltip } from "../../../_components/ui/tooltip";
import { useListing } from "../../../_hooks/use-listing";
import { useDataStore } from "../../../_stores/data-store";
import { useAuthStore } from "../../../_stores/auth-store";
import { getPartnerLabels, isRestaurant } from "../../../_lib/utils/partner-labels";
import {
  CANCELLATION_POLICY_INFO,
  CancellationPolicy,
} from "../../../_lib/domain/listing";
import { cn } from "../../../_lib/utils/cn";
import { formatMoney } from "../../../_lib/utils/format";

const schema = z.object({
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: 14:00"),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: 12:00"),
  cancellationPolicy: z.nativeEnum(CancellationPolicy),
  smokingAllowed: z.boolean(),
  petsAllowed: z.boolean(),
  childrenAllowed: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function RulesEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useListing();
  const update = useDataStore((s) => s.updateListingRules);
  const addFee = useDataStore((s) => s.addExtraFee);
  const removeFee = useDataStore((s) => s.removeExtraFee);
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  const restaurant = isRestaurant(partnerType);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  useEffect(() => {
    if (open) form.reset(data);
  }, [open, data, form]);

  const watched = useWatch({ control: form.control });
  const currentPolicy = watched.cancellationPolicy ?? data.cancellationPolicy;
  const smokingAllowed = watched.smokingAllowed ?? data.smokingAllowed;
  const petsAllowed = watched.petsAllowed ?? data.petsAllowed;
  const childrenAllowed = watched.childrenAllowed ?? data.childrenAllowed;

  const onSave = form.handleSubmit((v) => {
    update(v);
    toast.success("Uy qoidalari saqlandi");
    onClose();
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Uy qoidalari"
      description="Ish vaqtlari, bekor qilish siyosati va qo'shimcha to'lovlar."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor
          </Button>
          <Button onClick={onSave} disabled={!form.formState.isDirty}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Vaqtlar */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            {labels.checkInLabel} va {labels.checkOutLabel.toLowerCase()}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="in">{labels.checkInLabel}</Label>
              <Input
                id="in"
                type="time"
                {...form.register("checkInTime")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="out">{labels.checkOutLabel}</Label>
              <Input
                id="out"
                type="time"
                {...form.register("checkOutTime")}
              />
            </div>
          </div>
        </section>

        {/* Bekor qilish */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Bekor qilish siyosati
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.values(CancellationPolicy).map((policy) => {
              const info = CANCELLATION_POLICY_INFO[policy];
              const selected = currentPolicy === policy;
              return (
                <label
                  key={policy}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-all",
                    selected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={policy}
                      checked={selected}
                      onChange={() =>
                        form.setValue("cancellationPolicy", policy, {
                          shouldDirty: true,
                        })
                      }
                      className="h-4 w-4 accent-brand-700"
                    />
                    <span className="font-semibold">{info.label}</span>
                  </div>
                  <p className="ml-6 text-xs text-[var(--muted-foreground)]">
                    {info.description}
                  </p>
                </label>
              );
            })}
          </div>
        </section>

        {/* Qo'shimcha qoidalar */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Qo'shimcha qoidalar
          </h3>
          <div className="flex flex-col gap-2">
            <RuleToggle
              icon={<Cigarette className="h-4 w-4" aria-hidden />}
              label="Chekish ruxsat etilgan"
              checked={smokingAllowed}
              onChange={(v) =>
                form.setValue("smokingAllowed", v, { shouldDirty: true })
              }
            />
            <RuleToggle
              icon={<Dog className="h-4 w-4" aria-hidden />}
              label="Uy hayvonlari ruxsat etilgan"
              checked={petsAllowed}
              onChange={(v) =>
                form.setValue("petsAllowed", v, { shouldDirty: true })
              }
            />
            {!restaurant && (
              <RuleToggle
                icon={<Baby className="h-4 w-4" aria-hidden />}
                label="Bolalar bilan mos"
                checked={childrenAllowed}
                onChange={(v) =>
                  form.setValue("childrenAllowed", v, { shouldDirty: true })
                }
              />
            )}
          </div>
        </section>

        {/* Qo'shimcha to'lovlar */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Qo'shimcha to'lovlar
          </h3>
          <ExtraFeesEditor
            fees={data.extraFees}
            restaurant={restaurant}
            onAdd={(fee) => {
              addFee(fee);
              toast.success("Qo'shildi");
            }}
            onRemove={(id) => {
              removeFee(id);
              toast.success("O'chirildi");
            }}
          />
        </section>
      </div>
    </Drawer>
  );
}

function RuleToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--surface-muted)]">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
          {icon}
        </span>
        <span className="font-medium">{label}</span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-brand-700"
      />
    </label>
  );
}

function ExtraFeesEditor({
  fees,
  restaurant,
  onAdd,
  onRemove,
}: {
  fees: import("../../../_lib/domain/listing").ExtraFee[];
  restaurant: boolean;
  onAdd: (
    fee: Omit<import("../../../_lib/domain/listing").ExtraFee, "id">,
  ) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [charge, setCharge] = useState<
    "per_stay" | "per_night" | "per_person"
  >("per_stay");
  const [required, setRequired] = useState(true);

  const chargeLabel = {
    per_stay: "Butun bron",
    per_night: restaurant ? "Har bron" : "Har kecha",
    per_person: "Har mehmon",
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const amt = Number(amount);
          if (!name.trim() || !Number.isFinite(amt) || amt <= 0) {
            toast.error("Nom va summa kiriting");
            return;
          }
          onAdd({ name: name.trim(), amount: amt, charge, required });
          setName("");
          setAmount("");
        }}
        className="grid gap-2"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Nomi (masalan: Turist soligi)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            step={1000}
            placeholder="Summa (so'm)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <select
            value={charge}
            onChange={(e) => setCharge(e.target.value as typeof charge)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-brand-600 focus:outline-none"
          >
            <option value="per_stay">Butun bron uchun</option>
            <option value="per_night">{restaurant ? "Har bron uchun" : "Har kecha uchun"}</option>
            <option value="per_person">Har mehmon uchun</option>
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 accent-brand-700"
            />
            Majburiy
          </label>
          <Button type="submit">
            <Plus className="h-4 w-4" aria-hidden />
            Qo'shish
          </Button>
        </div>
      </form>

      {fees.length === 0 ? (
        <EmptyState
          title="Qo'shimcha to'lov yo'q"
          description="Turist soligi, garov puli va h.k."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-card border border-[var(--border)]">
          {fees.map((fee) => (
            <li
              key={fee.id}
              className="flex items-center justify-between gap-2 px-4 py-2.5"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {fee.name}
                  {!fee.required && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      Ixtiyoriy
                    </span>
                  )}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatMoney(fee.amount)} — {chargeLabel[fee.charge]}
                </span>
              </div>
              <Tooltip content="O'chirish">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(fee.id)}
                  aria-label="O'chirish"
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
