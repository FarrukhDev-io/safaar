"use client";

import {
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../_components/ui/button";
import { Drawer } from "../../../_components/ui/drawer";
import { EmptyState } from "../../../_components/ui/empty-state";
import { Input } from "../../../_components/ui/input";
import { Label } from "../../../_components/ui/label";
import { Tooltip } from "../../../_components/ui/tooltip";
import { useListing } from "../../../_hooks/use-listing";
import { useDataStore } from "../../../_stores/data-store";
import { searchAddress, type GeocodeResult } from "../../../_lib/utils/geocoding";

const LocationMap = dynamic(() => import("../../../_components/domain/location-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--muted-foreground)]">
      Xarita yuklanmoqda...
    </div>
  ),
});

export function LocationEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useListing();
  const addNearby = useDataStore((s) => s.addNearby);
  const removeNearby = useDataStore((s) => s.removeNearby);
  const updateLocation = useDataStore((s) => s.updateListingLocation);
  const [name, setName] = useState("");
  const [distance, setDistance] = useState("");
  const [locating, setLocating] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowResults(true);

    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchAbort.current?.abort();

    if (value.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(() => {
      const controller = new AbortController();
      searchAbort.current = controller;
      searchAddress(value, controller.signal)
        .then((r) => setResults(r))
        .catch((err) => {
          if (err.name !== "AbortError") setResults([]);
        })
        .finally(() => setSearching(false));
    }, 400);
  };

  const handlePickResult = (result: GeocodeResult) => {
    const latitude = Number(result.lat.toFixed(6));
    const longitude = Number(result.lon.toFixed(6));
    updateLocation({ latitude, longitude });
    setFlyTo({ lat: latitude, lng: longitude });
    setQuery(result.label);
    setShowResults(false);
    toast.success("Lakatsiya xaritada belgilandi");
  };

  const handleMapChange = (lat: number, lng: number) => {
    updateLocation({ latitude: lat, longitude: lng });
  };

  const hasCoordinates =
    typeof data.latitude === "number" && typeof data.longitude === "number";
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    : null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Joy nomini kiriting");
      return;
    }
    if (!/^\d+[.,]?\d*\s*(m|km)$/i.test(distance.trim())) {
      toast.error("Masofa noto'g'ri. Masalan: 500 m yoki 12 km");
      return;
    }
    addNearby(name.trim(), distance.trim());
    setName("");
    setDistance("");
    toast.success("Qo'shildi");
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Brauzeringiz lakatsiyani qo'llab-quvvatlamaydi");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        updateLocation({ latitude, longitude });
        setFlyTo({ lat: latitude, lng: longitude });
        setLocating(false);
        toast.success("Lakatsiya belgilandi", {
          description: `${latitude}, ${longitude}`,
        });
      },
      (error) => {
        setLocating(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Lakatsiyaga ruxsat berilmadi"
            : error.code === error.POSITION_UNAVAILABLE
              ? "Lakatsiyani aniqlab bo'lmadi"
              : "Lakatsiya olish vaqti tugadi";
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 60_000,
      },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Joylashuv"
      description="Manzil va yaqin diqqatga sazovor joylar."
      size="lg"
      footer={<Button onClick={onClose}>Yopish</Button>}
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Shahar</Label>
            <Input value={data.city} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Manzil</Label>
            <Input value={data.address} disabled />
            <p className="text-xs text-[var(--muted-foreground)]">
              Manzilni Sozlamalar → Biznes bo'limidan o'zgartiring.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-card border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Xaritadagi lakatsiya</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  Manzilni qidiring yoki xaritada bosib/pinni sudrab aniq
                  nuqtani belgilang.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--foreground)] shadow-sm shadow-slate-950/5 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Xaritada
                  </a>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Navigation className="h-4 w-4" aria-hidden />
                  )}
                  {locating ? "Aniqlanmoqda..." : "Joriy lakatsiyam"}
                </Button>
              </div>
            </div>

            {/* Manzil qidiruvi */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="Manzilni qidiring — masalan: Samarqand, Registon"
                className="pl-9 pr-9"
                aria-label="Manzil qidirish"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  aria-label="Tozalash"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:bg-[var(--surface-hover)] hover:text-zinc-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}

              {showResults && (searching || results.length > 0) && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                  {searching ? (
                    <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--muted-foreground)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      Qidirilmoqda...
                    </li>
                  ) : (
                    results.map((r, i) => (
                      <li key={`${r.lat}-${r.lon}-${i}`}>
                        <button
                          type="button"
                          onClick={() => handlePickResult(r)}
                          className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-hover)]"
                        >
                          <MapPin
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                            aria-hidden
                          />
                          <span className="line-clamp-2">{r.label}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* Interaktiv xarita */}
            <div className="h-72 w-full overflow-hidden rounded-card border border-[var(--border)]">
              <LocationMap
                latitude={data.latitude}
                longitude={data.longitude}
                onChange={handleMapChange}
                flyTo={flyTo}
              />
            </div>

            {hasCoordinates ? (
              <p className="font-mono text-xs text-[var(--foreground)]">
                {data.latitude?.toFixed(6)}, {data.longitude?.toFixed(6)}
              </p>
            ) : (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Lakatsiya hali belgilanmagan — xaritani bosib belgilang.
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">
              Yaqin diqqatga sazovor joylar
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Aeroport, muzey, restoran va h.k. — 3-5 ta joy tavsiya qilinadi.
            </p>
          </div>

          <form onSubmit={handleAdd} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
            <Input
              placeholder="Registon maydoni"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Joy nomi"
            />
            <Input
              placeholder="500 m"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              aria-label="Masofa"
            />
            <Button type="submit">
              <Plus className="h-4 w-4" aria-hidden />
              Qo'shish
            </Button>
          </form>

          {data.nearby.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-8 w-8" aria-hidden />}
              title="Hozircha hech narsa yo'q"
              description="Yaqin diqqatga sazovor joylarni qo'shing."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)] rounded-card border border-[var(--border)]">
              {data.nearby.map((place) => (
                <li
                  key={place.id}
                  className="flex items-center justify-between gap-2 px-4 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4 text-brand-700 dark:text-brand-300"
                      aria-hidden
                    />
                    <span className="font-medium">{place.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {place.distance}
                    </span>
                  </div>
                  <Tooltip content="O'chirish">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        removeNearby(place.id);
                        toast.success("O'chirildi");
                      }}
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
      </div>
    </Drawer>
  );
}
