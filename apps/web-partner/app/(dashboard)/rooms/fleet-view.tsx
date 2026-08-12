"use client";

import { Bus, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../_components/layout/page-header";
import { Button } from "../../_components/ui/button";
import { Card, CardBody } from "../../_components/ui/card";
import { Drawer } from "../../_components/ui/drawer";
import { EmptyState } from "../../_components/ui/empty-state";
import { Input } from "../../_components/ui/input";
import { Label } from "../../_components/ui/label";
import {
  useBusCompany,
  useCreateVehicle,
  useUpdateVehicle,
  useVehicles,
  type VehicleDraft,
} from "../../_hooks/use-fleet";
import type { BackendVehicle } from "../../_lib/api/endpoints/partners";

const EMPTY_DRAFT: VehicleDraft = { name: "", plateNumber: "", seatsCount: 0 };

/**
 * Transport (bus) hamkori uchun "Transport Parki" — mehmonxonaning
 * `RoomsView`iga (qavat/xona xaritasi) mos emas, chunki `vehicles`
 * jadvali butunlay boshqa maydonlarga ega (davlat raqami, o'rindiqlar
 * soni). Har bir shu yerda yaratilgan faol transport vositasi public
 * `/transport` sahifasida (`GET /catalog/transports`) alohida ko'rinadi —
 * bu sahifa haqiqiy hamkorni public katalogga bog'laydigan yagona joy.
 */
export function FleetView() {
  const { data: company } = useBusCompany();
  const { data: vehicles, isLoading } = useVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BackendVehicle | null>(null);
  const [draft, setDraft] = useState<VehicleDraft>(EMPTY_DRAFT);

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setDrawerOpen(true);
  };

  const openEdit = (vehicle: BackendVehicle) => {
    setEditing(vehicle);
    setDraft({
      name: vehicle.name,
      plateNumber: vehicle.plate_number ?? "",
      seatsCount: vehicle.seats_count,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    if (draft.name.trim().length < 2) {
      toast.error("Transport nomini kiriting");
      return;
    }
    if (!draft.seatsCount || draft.seatsCount < 1) {
      toast.error("O'rindiqlar sonini to'g'ri kiriting");
      return;
    }
    try {
      if (editing) {
        await updateVehicle.mutateAsync({ id: editing.id, values: draft });
        toast.success("Saqlandi");
      } else {
        await createVehicle.mutateAsync(draft);
        toast.success("Transport qo'shildi");
      }
      setDrawerOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saqlab bo'lmadi");
    }
  };

  const pending = createVehicle.isPending || updateVehicle.isPending;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="Avtopark"
        title="Transport Parki"
        description="Har bir faol transport mijozlarga Transport sahifasida ko'rinadi."
        actions={
          company ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Yangi transport
            </Button>
          ) : undefined
        }
      />

      {!company ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Bus className="h-7 w-7" aria-hidden />}
              title="Avval kompaniya e'lonini yarating"
              description="Transport qo'shishdan oldin 'Kompaniya e'loni' bo'limida kompaniya nomini kiriting."
            />
          </CardBody>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardBody className="h-32 animate-pulse" />
        </Card>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Bus className="h-7 w-7" aria-hidden />}
              title="Hali transport qo'shilmagan"
              description="Mijozlar sizni Transport sahifasida topishi uchun kamida bitta transport qo'shing."
              action={<Button onClick={openCreate}>Yangi transport qo'shish</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{vehicle.name}</p>
                    {vehicle.plate_number && (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {vehicle.plate_number}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Tahrirlash"
                    onClick={() => openEdit(vehicle)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    O'rindiqlar
                  </span>
                  <span className="font-medium">{vehicle.seats_count}</span>
                </div>
                <span
                  className={
                    vehicle.status === "active"
                      ? "text-sm font-medium text-emerald-700 dark:text-emerald-400"
                      : "text-sm font-medium text-[var(--muted-foreground)]"
                  }
                >
                  {vehicle.status === "active" ? "Faol" : (vehicle.status ?? "Faol")}
                </span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Transportni tahrirlash" : "Yangi transport"}
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSubmit} loading={pending}>
              Saqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vehicle-name">Nomi</Label>
            <Input
              id="vehicle-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Masalan: Mercedes Sprinter"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vehicle-plate">Davlat raqami</Label>
            <Input
              id="vehicle-plate"
              value={draft.plateNumber}
              onChange={(e) =>
                setDraft((d) => ({ ...d, plateNumber: e.target.value }))
              }
              placeholder="01 A 123 BC"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vehicle-seats">O'rindiqlar soni</Label>
            <Input
              id="vehicle-seats"
              type="number"
              min={1}
              value={draft.seatsCount || ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  seatsCount: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
