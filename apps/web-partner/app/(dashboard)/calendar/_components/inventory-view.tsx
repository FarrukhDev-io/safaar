"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, Unlock, Save, AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardBody } from "../../../_components/ui/card";
import { EmptyState } from "../../../_components/ui/empty-state";
import { usePrimaryHotel } from "../../../_hooks/use-primary-hotel";
import { useRooms } from "../../../_hooks/use-rooms";
import { useAuthStore } from "../../../_stores/auth-store";
import { cn } from "../../../_lib/utils/cn";
import {
  getInventory,
  updateInventory,
  createBlackoutDates,
  type BackendInventoryDay,
} from "../../../_lib/api/endpoints/partners";
import { toast } from "sonner";

const WINDOW_SIZE = 14;
const WEEKDAY_LABEL = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
const MONTH_LABEL = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

/** UTC-xavfsiz sana arifmetikasi — mahalliy vaqt zonasidan qat'i nazar
 * bitta kunga siljish har doim bitta kalendar kuniga mos keladi. */
function todayUtcIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10);
}

function addDaysUtc(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function dateRangeUtc(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  let cursor = startIso;
  let guard = 0;
  while (cursor <= endIso && guard < 400) {
    dates.push(cursor);
    cursor = addDaysUtc(cursor, 1);
    guard += 1;
  }
  return dates;
}

function formatDayLabel(iso: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: WEEKDAY_LABEL[dt.getUTCDay()],
    day: dt.getUTCDate(),
    month: MONTH_LABEL[dt.getUTCMonth()],
  };
}

const TODAY_UTC_ISO = todayUtcIso();

export function InventoryView() {
  const token = useAuthStore((s) => s.tokens?.accessToken);
  const { data: hotel } = usePrimaryHotel();
  const { data: rooms, isLoading: roomsLoading } = useRooms();

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [windowStart, setWindowStart] = useState(TODAY_UTC_ISO);
  const [inventory, setInventory] = useState<BackendInventoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [blackoutRange, setBlackoutRange] = useState<{ start: string; end: string } | null>(null);
  const [blackoutSubmitting, setBlackoutSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const fetchInventory = () => {
    if (!hotel?.id || !token) return;
    setLoading(true);
    setError(false);
    getInventory(hotel.id, token)
      .then((rows) => setInventory(rows))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel?.id, token]);

  const windowDates = useMemo(
    () => Array.from({ length: WINDOW_SIZE }, (_, i) => addDaysUtc(windowStart, i)),
    [windowStart],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, BackendInventoryDay>();
    for (const row of inventory) {
      if (row.room_id === selectedRoomId) map.set(row.date, row);
    }
    return map;
  }, [inventory, selectedRoomId]);

  const handleSaveCount = async (date: string) => {
    if (!hotel?.id || !selectedRoomId) return;
    const value = Number(editValue);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Sonlar manfiy bo'lmasligi kerak");
      return;
    }
    const key = `${selectedRoomId}:${date}`;
    setSavingKey(key);
    try {
      await updateInventory(hotel.id, [{ room_id: selectedRoomId, date, total_count: value }], token);
      toast.success("Zaxira yangilandi");
      setEditingDate(null);
      fetchInventory();
    } catch (e: any) {
      toast.error(e?.message || "Yangilab bo'lmadi");
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggleClosed = async (date: string, closed: boolean) => {
    if (!hotel?.id || !selectedRoomId) return;
    const key = `${selectedRoomId}:${date}`;
    setSavingKey(key);
    try {
      // `total_count` doim yuboriladi — aks holda backend uni xonaning
      // standart qiymatiga qaytarib qo'yadi (avval maxsus belgilangan son
      // yo'qolib qolardi, faqat closed holatini o'zgartirmoqchi bo'lsak ham).
      const currentCount = byDate.get(date)?.total_count;
      await updateInventory(
        hotel.id,
        [{ room_id: selectedRoomId, date, closed, ...(currentCount != null ? { total_count: currentCount } : {}) }],
        token,
      );
      toast.success(closed ? "Sana yopildi" : "Sana ochildi");
      fetchInventory();
    } catch (e: any) {
      toast.error(e?.message || "Amalni bajarib bo'lmadi");
    } finally {
      setSavingKey(null);
    }
  };

  const handleApplyBlackoutRange = async () => {
    if (!hotel?.id || !selectedRoomId || !blackoutRange) return;
    if (blackoutRange.end < blackoutRange.start) {
      toast.error("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
      return;
    }
    const dates = dateRangeUtc(blackoutRange.start, blackoutRange.end);
    setBlackoutSubmitting(true);
    try {
      await createBlackoutDates(hotel.id, { dates, room_id: selectedRoomId }, token);
      toast.success(`${dates.length} kun yopildi`);
      setBlackoutRange(null);
      fetchInventory();
    } catch (e: any) {
      toast.error(e?.message || "Bloklab bo'lmadi");
    } finally {
      setBlackoutSubmitting(false);
    }
  };

  if (roomsLoading || (loading && inventory.length === 0 && !error)) {
    return (
      <Card>
        <CardBody className="py-16 text-center text-sm text-[var(--muted-foreground)]">
          Yuklanmoqda...
        </CardBody>
      </Card>
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="Xonalar mavjud emas"
        description="Zaxirani boshqarish uchun avval xona qo'shing."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">Xona:</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.roomTypeName} · {room.number}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWindowStart((w) => addDaysUtc(w, -WINDOW_SIZE))}
            className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
            aria-label="Oldingi davr"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {formatDayLabel(windowDates[0]).day} {formatDayLabel(windowDates[0]).month} —{" "}
            {formatDayLabel(windowDates[windowDates.length - 1]).day}{" "}
            {formatDayLabel(windowDates[windowDates.length - 1]).month}
          </span>
          <button
            type="button"
            onClick={() => setWindowStart((w) => addDaysUtc(w, WINDOW_SIZE))}
            className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
            aria-label="Keyingi davr"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm text-[var(--muted-foreground)]">Zaxirani yuklab bo'lmadi</p>
            <button onClick={fetchInventory} className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
              <RotateCcw className="h-3.5 w-3.5" /> Qayta urinish
            </button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <div className="grid min-w-[900px] grid-cols-[repeat(14,minmax(0,1fr))] gap-px bg-[var(--border)]">
                {windowDates.map((date) => {
                  const label = formatDayLabel(date);
                  const day = byDate.get(date);
                  const bookedCount = day?.booked_count ?? 0;
                  const heldCount = day?.held_count ?? 0;
                  const available = Math.max(0, (day?.total_count ?? 1) - bookedCount - heldCount);
                  const closed = day?.closed ?? false;
                  const isPast = date < TODAY_UTC_ISO;
                  const key = `${selectedRoomId}:${date}`;
                  const isSaving = savingKey === key;
                  const isEditing = editingDate === date;

                  return (
                    <div
                      key={date}
                      className={cn(
                        "flex flex-col gap-1 bg-[var(--surface)] p-2 text-center",
                        closed && "bg-red-50 dark:bg-red-950/20",
                        isPast && "opacity-50",
                      )}
                    >
                      <span className="text-[10px] font-medium uppercase text-[var(--muted-foreground)]">
                        {label.weekday}
                      </span>
                      <span className="text-xs font-bold">{label.day}-{label.month}</span>

                      {closed ? (
                        <span className="inline-flex items-center justify-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          <Lock className="h-2.5 w-2.5" /> Yopiq
                        </span>
                      ) : isEditing ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full min-w-0 rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-center text-xs outline-none focus:border-brand-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCount(date)}
                            disabled={isSaving}
                            aria-label="Saqlash"
                            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <Save className="h-3 w-3" /> Saqlash
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isPast || isSaving}
                          onClick={() => {
                            setEditingDate(date);
                            setEditValue(String(day?.total_count ?? 1));
                          }}
                          className="text-sm font-bold hover:underline disabled:no-underline"
                          title="Zaxira sonini tahrirlash"
                        >
                          {available}/{day?.total_count ?? 1}
                        </button>
                      )}

                      {!isEditing && (
                        <button
                          type="button"
                          disabled={isPast || isSaving}
                          onClick={() => handleToggleClosed(date, !closed)}
                          className="mt-0.5 inline-flex items-center justify-center gap-1 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-brand-600 disabled:opacity-40"
                        >
                          {closed ? (
                            <>
                              <Unlock className="h-2.5 w-2.5" /> Ochish
                            </>
                          ) : (
                            <>
                              <Lock className="h-2.5 w-2.5" /> Yopish
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Sana oralig'ini yopish (Blackout)</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Boshlanish</label>
              <input
                type="date"
                min={TODAY_UTC_ISO}
                value={blackoutRange?.start ?? ""}
                onChange={(e) =>
                  setBlackoutRange((prev) => ({ start: e.target.value, end: prev?.end ?? e.target.value }))
                }
                className="rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Tugash</label>
              <input
                type="date"
                min={blackoutRange?.start ?? TODAY_UTC_ISO}
                value={blackoutRange?.end ?? ""}
                onChange={(e) =>
                  setBlackoutRange((prev) => ({ start: prev?.start ?? e.target.value, end: e.target.value }))
                }
                className="rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyBlackoutRange}
              disabled={!blackoutRange?.start || !blackoutRange?.end || blackoutSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {blackoutSubmitting ? "Bajarilmoqda..." : "Yopish"}
            </button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Tanlangan xona uchun barcha kunlar band emas deb belgilanadi (mehmonlar bron qila olmaydi).
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
