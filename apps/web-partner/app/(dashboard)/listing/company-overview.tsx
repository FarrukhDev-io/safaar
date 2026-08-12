"use client";

import { Building2, CheckCircle2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../_components/layout/page-header";
import { Button } from "../../_components/ui/button";
import { Card, CardBody } from "../../_components/ui/card";
import { EmptyState } from "../../_components/ui/empty-state";
import { Input } from "../../_components/ui/input";
import { Label } from "../../_components/ui/label";
import {
  useBusCompany,
  useCreateBusCompany,
  useUpdateBusCompany,
} from "../../_hooks/use-fleet";

/**
 * Transport (bus) hamkori uchun "Kompaniya e'loni" — mehmonxonaning
 * `ListingOverview`siga (rasmlar/qulayliklar/joylashuv/qoidalar) mos
 * emas, chunki `bus_companies` jadvalida bunday maydonlar umuman yo'q.
 * Avval bu yo'l (`/listing`) transport hamkorlari uchun ham xuddi
 * ListingOverview'ni ko'rsatardi — u haqiqatda `hotels` jadvaliga yozardi,
 * `bus_companies`ga EMAS, shuning uchun public `/transport` sahifasida
 * hech qachon ko'rinmasdi (`GET /catalog/transports` faqat `vehicles`/
 * `bus_companies`ni o'qiydi).
 */
export function CompanyOverview() {
  const { data: company, isLoading } = useBusCompany();
  const createCompany = useCreateBusCompany();
  const updateCompany = useUpdateBusCompany();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (company?.name) setName(company.name);
  }, [company?.name]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-10">
        <PageHeader eyebrow="Sotuv" title="Kompaniya e'loni" />
        <Card>
          <CardBody className="h-32 animate-pulse" />
        </Card>
      </div>
    );
  }

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Kompaniya nomini kiriting");
      return;
    }
    try {
      await createCompany.mutateAsync(trimmed);
      toast.success("Kompaniya e'loni yaratildi");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Yaratib bo'lmadi",
      );
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Kompaniya nomini kiriting");
      return;
    }
    try {
      await updateCompany.mutateAsync(trimmed);
      toast.success("Saqlandi");
      setEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Saqlab bo'lmadi",
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-10">
      <PageHeader
        eyebrow="Sotuv"
        title="Kompaniya e'loni"
        description="Bu ma'lumot mijozlarga Transport sahifasida ko'rinadi."
      />

      {!company ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Building2 className="h-7 w-7" aria-hidden />}
              title="Kompaniya e'loni hali yaratilmagan"
              description="Mijozlar sizni Transport sahifasida topishi uchun avval kompaniya nomini kiriting."
              action={
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Comfort Bus"
                    className="sm:w-64"
                    aria-label="Kompaniya nomi"
                  />
                  <Button
                    onClick={handleCreate}
                    disabled={createCompany.isPending}
                  >
                    Yaratish
                  </Button>
                </div>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              E'lon faol — mijozlar Transport sahifasida ko'ra oladi
            </div>

            {editing ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="company-name">Kompaniya nomi</Label>
                  <Input
                    id="company-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateCompany.isPending}>
                    Saqlash
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setName(company.name);
                    }}
                  >
                    Bekor qilish
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                    Kompaniya nomi
                  </p>
                  <p className="text-lg font-semibold">{company.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Tahrirlash
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <p className="text-sm text-[var(--muted-foreground)]">
        Transport vositalaringizni "Transport Parki" bo'limida qo'shing —
        har bir faol transport mijozlarga Transport sahifasida alohida
        ko'rinadi.
      </p>
    </div>
  );
}
