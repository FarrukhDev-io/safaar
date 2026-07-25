"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Utensils,
  Clock,
  PhoneCall,
  X,
  CheckCircle2,
  Calendar,
  Users,
  User,
  Phone,
} from "lucide-react";
import { formatSum } from "@/lib/money";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DatePicker } from "@/components/ui/DatePicker";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_RESTAURANTS } from "@/components/catalog/data";
import type { RestaurantItem } from "@/components/catalog/types";

export type { RestaurantItem };

import { LayoutGrid, Map as MapIcon } from "lucide-react";
import { InteractiveMapView, type MapMarkerItem } from "@/components/features/map/InteractiveMapView";

export function RestaurantsView({ dict }: { dict: CatalogDict["restaurants"] }) {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reservation form state
  const [guestCount, setGuestCount] = useState(2);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("18:00");
  const [fullName, setFullName] = useState("");
  const [phoneInput, setPhoneInput] = useState("+998");
  const [isSuccess, setIsSuccess] = useState(false);

  const cities = Array.from(new Set(MOCK_RESTAURANTS.map((r) => r.cityName)));

  const filtered = MOCK_RESTAURANTS.filter((r) => {
    const matchesQuery =
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(query.toLowerCase());
    const matchesCity =
      selectedCity === "all" || r.cityName.toLowerCase() === selectedCity.toLowerCase();
    return matchesQuery && matchesCity;
  });

  const mapItems: MapMarkerItem[] = filtered.map((r) => ({
    id: r.id,
    name: r.name,
    cityName: r.cityName,
    address: r.address,
    priceFormatted: formatSum(r.averageCheckSum),
    rating: r.rating,
    imageUrl: r.imageUrl,
  }));

  function handleOpenModal(restaurant: RestaurantItem) {
    setSelectedRestaurant(restaurant);
    setIsSuccess(false);
    setGuestCount(2);
  }

  function handleCloseModal() {
    setSelectedRestaurant(null);
    setIsSuccess(false);
  }

  function handleReserveSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSuccess(true);
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <CatalogHeader
        icon={<Utensils className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={dict.searchPlaceholder}
        filterControls={
          <div className="flex items-center gap-3">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-xs transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">{dict.allCities}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>Xarita</span>
              </button>
            </div>
          </div>
        }
      />

      {viewMode === "map" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_450px]">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`transition-all duration-200 rounded-2xl ${
                  selectedId === item.id ? "ring-2 ring-blue-500 shadow-lg" : ""
                }`}
              >
                <Card className="group flex flex-col overflow-hidden">
                  <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 400px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <Badge variant="outline" className="absolute left-3 top-3 z-10 gap-1 text-amber-700 shadow-xs">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" aria-hidden />
                      {item.rating.toFixed(1)}
                    </Badge>
                  </div>
                  <CardBody className="flex flex-1 flex-col justify-between p-4">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.cityName} · {item.cuisine}</p>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {dict.avgCheck}: {formatSum(item.averageCheckSum)}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3 w-full text-xs font-bold"
                      onClick={() => handleOpenModal(item)}
                    >
                      {dict.reserveTable}
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
            <InteractiveMapView
              items={mapItems}
              hoveredItemId={hoveredId}
              selectedItemId={selectedId}
              onSelectItem={(item) => setSelectedId(item.id)}
              className="h-[450px] w-full lg:h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      ) : (
        /* Grid listing */
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((item) => (
            <Card key={item.id} className="group flex flex-col overflow-hidden">
              <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 600px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge variant="outline" className="absolute left-3 top-3 z-10 gap-1 text-amber-700 shadow-xs">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" aria-hidden />
                  {item.rating.toFixed(1)}
                </Badge>
              </div>

              <CardBody className="flex flex-1 flex-col justify-between p-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </h2>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.cuisine}
                    </span>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {item.cityName} · {item.address}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {item.workingHours}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {dict.avgCheck}: {formatSum(item.averageCheckSum)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={`tel:${item.phone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{item.phone}</span>
                  </a>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-bold whitespace-nowrap px-3 sm:w-auto"
                    onClick={() => handleOpenModal(item)}
                  >
                    {dict.reserveTable}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Table Reservation Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseModal}
          />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {!isSuccess ? (
              <form onSubmit={handleReserveSubmit} className="flex flex-col gap-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={selectedRestaurant.imageUrl}
                      alt={selectedRestaurant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedRestaurant.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedRestaurant.cityName} · {selectedRestaurant.cuisine}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      {dict.guests}
                    </span>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} kishi
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      {dict.date}
                    </span>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    {dict.time}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["12:00", "14:00", "18:00", "19:30", "20:30"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                          time === t
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    {dict.fullName}
                  </span>
                  <Input
                    type="text"
                    required
                    placeholder="Masalan: Jasur Rahimov"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    {dict.phone}
                  </span>
                  <Input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                  />
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700"
                >
                  {dict.confirm}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  {dict.successTitle}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {dict.successDesc}
                </p>

                <div className="mt-6 flex w-full flex-col gap-3">
                  <a
                    href={`tel:${selectedRestaurant.phone.replace(/\s+/g, "")}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{dict.callNow}: {selectedRestaurant.phone}</span>
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseModal}
                    className="w-full rounded-2xl"
                  >
                    {dict.close}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
