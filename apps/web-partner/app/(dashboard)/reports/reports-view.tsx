"use client";

import {
  Activity,
  BedDouble,
  CarFront,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Calendar,
  UtensilsCrossed,
  Download,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardBody,
} from "../../_components/ui/card";
import { PageHeader } from "../../_components/layout/page-header";
import { formatMoney } from "../../_lib/utils/format";
import {
  addDays,
  buildDachaAvailabilitySummary,
  buildDailyStats,
  buildSourceDistribution,
  buildUnitTypeDistribution,
} from "../../_lib/domain/reports";
import { useReservations } from "../../_hooks/use-reservations";
import { useRoomTypes } from "../../_hooks/use-room-types";
import { useDataStore } from "../../_stores/data-store";
import { useAuthStore } from "../../_stores/auth-store";
import { getPartnerLabels, hasBuses, isDacha, isRestaurant } from "../../_lib/utils/partner-labels";
import { TODAY_ISO } from "../../_lib/utils/date";
import { cn } from "../../_lib/utils/cn";
import {
  getWithdrawals,
  createWithdrawal,
  WithdrawalRequest,
  getFinanceOverview,
  createFinanceExport,
  getFinanceDocuments,
  getFinanceDocumentDownload,
  getLedger,
} from "../../_lib/api/endpoints/partners";
import { toWithdrawal, toFinanceOverview, FinanceOverview, toLedgerEntry, LedgerEntry } from "../../_lib/api/adapters";
import { formatDate } from "../../_lib/utils/format";

type TimeRange = "7days" | "30days" | "year";
type ViewTab = "stats" | "finance";

export function ReportsView() {
  const [activeTab, setActiveTab] = useState<ViewTab>("stats");
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");
  
  const { data: reservations } = useReservations();
  const { data: roomTypes } = useRoomTypes();
  const getStats = useDataStore((s) => s.getStats);
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const token = useAuthStore((s) => s.tokens?.accessToken);
  const labels = getPartnerLabels(partnerType);
  const dacha = isDacha(partnerType);
  const restaurant = isRestaurant(partnerType);
  const isBus = hasBuses(partnerType);

  // Finance states
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeOverview, setFinanceOverview] = useState<FinanceOverview | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [reportDownloading, setReportDownloading] = useState(false);

  // Balans tarixi (ledger) — har bir daromad/komissiya/qaytarish yozuvi
  const LEDGER_PAGE_SIZE = 20;
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerLoadingMore, setLedgerLoadingMore] = useState(false);
  const [ledgerError, setLedgerError] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerHasMore, setLedgerHasMore] = useState(true);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>("all");
  const [ledgerSort, setLedgerSort] = useState<{ sortBy: "created_at" | "amount"; order: "asc" | "desc" }>(
    { sortBy: "created_at", order: "desc" },
  );

  const fetchLedger = async (
    page: number,
    sort: { sortBy: "created_at" | "amount"; order: "asc" | "desc" },
  ) => {
    try {
      if (page === 1) setLedgerLoading(true);
      else setLedgerLoadingMore(true);
      setLedgerError(false);
      const rows = await getLedger(
        { page, limit: LEDGER_PAGE_SIZE, sortBy: sort.sortBy, order: sort.order },
        token,
      );
      const mapped = rows.map(toLedgerEntry);
      setLedgerEntries((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      setLedgerHasMore(rows.length === LEDGER_PAGE_SIZE);
      setLedgerPage(page);
    } catch (e) {
      setLedgerError(true);
    } finally {
      setLedgerLoading(false);
      setLedgerLoadingMore(false);
    }
  };

  const ledgerTypeLabel = (type: string): string => {
    switch (type) {
      case "booking_earned":
        return "Bron daromadi";
      case "refund":
        return "Qaytarish";
      case "adjustment":
        return "Tuzatish";
      default:
        return type;
    }
  };

  const ledgerTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    ledgerEntries.forEach((e) => seen.add(e.type));
    return Array.from(seen);
  }, [ledgerEntries]);

  const filteredLedgerEntries = useMemo(
    () =>
      ledgerTypeFilter === "all"
        ? ledgerEntries
        : ledgerEntries.filter((e) => e.type === ledgerTypeFilter),
    [ledgerEntries, ledgerTypeFilter],
  );

  const fetchWithdrawals = async () => {
    try {
      setFinanceLoading(true);
      const data = await getWithdrawals(token);
      setWithdrawals(data.map(toWithdrawal));
    } catch (e) {
      toast.error("Pul yechish tarixini yuklab bo'lmadi");
    } finally {
      setFinanceLoading(false);
    }
  };

  const fetchFinanceOverview = async () => {
    try {
      setBalanceLoading(true);
      const data = await getFinanceOverview(token);
      setFinanceOverview(toFinanceOverview(data));
    } catch (e) {
      toast.error("Balansni yuklab bo'lmadi");
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "finance" && token) {
      fetchWithdrawals();
      fetchFinanceOverview();
      fetchLedger(1, ledgerSort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ledgerSort, token]);

  const handleDownloadReport = async () => {
    setReportDownloading(true);
    try {
      await createFinanceExport({ format: "xlsx" }, token);
      // Export fon jarayonida generatsiya qilinadi — tayyor bo'lguncha
      // qisqa vaqt davomida so'raymiz (real backend job, fake emas).
      let downloadUrl: string | null = null;
      for (let attempt = 0; attempt < 8 && !downloadUrl; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const documents = await getFinanceDocuments(token);
        const latest = documents
          .filter((doc) => doc.type === "partner-finance")
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
        if (latest?.status === "ready") {
          const result = await getFinanceDocumentDownload(latest.id, token);
          downloadUrl = result.download_url;
        } else if (latest?.status === "failed") {
          break;
        }
      }
      if (downloadUrl) {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Hisobot hali tayyor emas, birozdan so'ng qayta urinib ko'ring");
      }
    } catch (e) {
      toast.error("Balans hisobotini yaratib bo'lmadi");
    } finally {
      setReportDownloading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !withdrawBank) {
      toast.error("Barcha maydonlarni to'g'ri to'ldiring");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createWithdrawal({ amount, bankAccount: withdrawBank }, token);
      toast.success("Pul yechish so'rovi yuborildi");
      setWithdrawAmount("");
      setWithdrawBank("");
      fetchWithdrawals();
    } catch (e) {
      toast.error("So'rov yuborishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysForRange = timeRange === "7days" ? 7 : timeRange === "year" ? 365 : 30;
  const dailyStats = useMemo(
    () => buildDailyStats(reservations, TODAY_ISO, daysForRange),
    [reservations, daysForRange],
  );
  const stats = getStats();
  const totalUnits = stats.totalRooms;

  const revenue = useMemo(
    () => dailyStats.map((d) => ({ date: d.date, revenue: d.revenue, bookings: d.bookings })),
    [dailyStats],
  );
  const occupancy = useMemo(
    () =>
      dailyStats.map((d) => ({
        date: d.date,
        occupancy: totalUnits > 0 ? Math.min(100, Math.round((d.occupiedUnits / totalUnits) * 100)) : 0,
      })),
    [dailyStats, totalUnits],
  );
  const unitTypeDistribution = useMemo(
    () => buildUnitTypeDistribution(reservations, roomTypes),
    [reservations, roomTypes],
  );
  const sourceDistribution = useMemo(
    () => buildSourceDistribution(reservations),
    [reservations],
  );
  const dachaSummary = useMemo(
    () => buildDachaAvailabilitySummary(dailyStats),
    [dailyStats],
  );

  const monthRevenue = revenue.reduce((s, d) => s + d.revenue, 0);
  const monthBookings = revenue.reduce((s, d) => s + d.bookings, 0);
  const avgOccupancy = occupancy.length
    ? Math.round(occupancy.reduce((s, d) => s + d.occupancy, 0) / occupancy.length)
    : 0;
  const adr = monthBookings > 0 ? Math.round(monthRevenue / monthBookings) : 0;

  // Trend badgelar avval hardcoded edi (+12%, +5%, -2%, +8%). Endi joriy
  // davrni undan oldingi teng uzunlikdagi davr bilan solishtirib hisoblaymiz.
  const previousPeriodStats = useMemo(
    () => buildDailyStats(reservations, addDays(TODAY_ISO, -daysForRange), daysForRange),
    [reservations, daysForRange],
  );
  const prevRevenue = previousPeriodStats.reduce((s, d) => s + d.revenue, 0);
  const prevBookings = previousPeriodStats.reduce((s, d) => s + d.bookings, 0);
  const prevOccupancy = totalUnits > 0 && previousPeriodStats.length
    ? Math.round(
        previousPeriodStats.reduce(
          (s, d) => s + Math.min(100, Math.round((d.occupiedUnits / totalUnits) * 100)),
          0,
        ) / previousPeriodStats.length,
      )
    : 0;
  const prevAdr = prevBookings > 0 ? Math.round(prevRevenue / prevBookings) : 0;

  const trendOf = (current: number, previous: number): { value: number; positive: boolean } | undefined => {
    if (previous === 0) {
      return current > 0 ? { value: 100, positive: true } : undefined;
    }
    const delta = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(delta), positive: delta >= 0 };
  };

  const revenueTrend = trendOf(monthRevenue, prevRevenue);
  const occupancyTrend = trendOf(avgOccupancy, prevOccupancy);
  const adrTrend = trendOf(adr, prevAdr);
  const bookingsTrend = trendOf(monthBookings, prevBookings);

  const recentRevenue = revenue.slice(-7).reverse();
  const recentOccupancy = occupancy.slice(-7).reverse();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Tahlil va Moliya"
          title="Biznes Hisobotlari"
          description="Moliyaviy holati, pul yechish va sotuvlar tahlili."
        />
        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("stats")}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "stats" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            Statistika
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === "finance" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            Moliya & Pul yechish
          </button>
        </div>
      </div>

      {activeTab === "stats" && (
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Vaqt Filtrlari */}
          <div className="flex justify-center md:justify-end">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl">
              <TimeTab active={timeRange === "7days"} onClick={() => setTimeRange("7days")} label="Oxirgi 7 kun" />
              <TimeTab active={timeRange === "30days"} onClick={() => setTimeRange("30days")} label="Oxirgi 30 kun" />
              <TimeTab active={timeRange === "year"} onClick={() => setTimeRange("year")} label="Joriy yil" />
            </div>
          </div>

          {/* Asosiy ko'rsatkichlar (KPIs) */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ReportMetric
              label="Umumiy Daromad"
              value={formatMoney(monthRevenue)}
              trend={revenueTrend}
              icon={<DollarSign className="h-6 w-6" />}
              tone="brand"
            />
            <ReportMetric
              label={isBus ? "O'rtacha Bandlik va Sig'im" : "O'rtacha Bandlik"}
              value={`${avgOccupancy}%`}
              trend={occupancyTrend}
              icon={<Activity className="h-6 w-6" />}
              tone="accent"
            />
            <ReportMetric
              label={isBus ? "O'rtacha ijara narxi" : restaurant ? "O'rtacha bron narxi" : "O'rtacha kunlik narx (ADR)"}
              value={formatMoney(adr)}
              trend={adrTrend}
              icon={<CreditCard className="h-6 w-6" />}
              tone="warning"
            />
            <ReportMetric
              label={isBus ? "Yangi Ijara Bronlari" : "Yangi Bronlar"}
              value={monthBookings.toString()}
              trend={bookingsTrend}
              icon={isBus ? <CarFront className="h-6 w-6" /> : restaurant ? <UtensilsCrossed className="h-6 w-6" /> : <BedDouble className="h-6 w-6" />}
              tone="success"
            />
          </section>

          {/* Daromad va Bandlik Ro'yxatlari */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 flex flex-col">
              <CardBody className="p-6 flex-1 flex flex-col">
                <div className="mb-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Oxirgi kunlar daromadi</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Kunlik tushumlar va bronlar soni</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-0">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    <span>Sana</span>
                    <span className="text-right w-16">Bronlar</span>
                    <span className="text-right w-24">Daromad</span>
                  </div>
                  
                  {recentRevenue.map((d) => (
                    <div key={d.date} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{formatShortDate(d.date)}</span>
                      </div>
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 text-right w-16">{d.bookings} ta</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white text-right w-24">{formatMoney(d.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 flex flex-col">
              <CardBody className="p-6 flex-1 flex flex-col">
                <div className="mb-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Oxirgi kunlar bandligi</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {labels.unitPlural.charAt(0).toUpperCase()}{labels.unitPlural.slice(1)} qanchalik to'lganligi (foizda)
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-0">
                  <div className="grid grid-cols-[1fr_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    <span>Sana</span>
                    <span className="text-right">To'liqlik (%)</span>
                  </div>
                  
                  {recentOccupancy.map((d) => (
                    <div key={d.date} className="grid grid-cols-[1fr_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{formatShortDate(d.date)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn(
                          "text-sm font-bold text-right",
                          d.occupancy >= 80 ? "text-emerald-600 dark:text-emerald-400" : 
                          d.occupancy >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {d.occupancy}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 flex flex-col">
              <CardBody className="p-6 flex-1 flex flex-col">
                <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Sotuv manbalari</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Mehmonlar qaysi platformalardan kelmoqda?</p>
                </div>
                
                <div className="flex flex-col gap-0">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    <span>Manba (Platforma)</span>
                    <span className="text-right w-16">Ulush</span>
                    <span className="text-right w-16">Bronlar</span>
                  </div>
                  
                  {(() => {
                    const totalSrc = sourceDistribution.reduce((s, r) => s + r.value, 0);
                    const sortedSrc = [...sourceDistribution].sort((a,b) => b.value - a.value).slice(0, 5);
                    
                    return sortedSrc.map((s) => {
                      const pct = totalSrc ? Math.round((s.value / totalSrc) * 100) : 0;
                      return (
                        <div key={s.name} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{s.name}</span>
                          <span className="text-sm font-medium text-zinc-500 text-right w-16">{pct}%</span>
                          <span className="text-sm font-bold text-zinc-900 dark:text-white text-right w-16">{s.value} ta</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardBody>
            </Card>

            {dacha ? (
              <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
                <CardBody className="p-6">
                  <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Bandlik holati</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Oxirgi {dachaSummary.totalNights} kunda dachangiz qanchalik band bo'lgan</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {dachaSummary.bookedNights}/{dachaSummary.totalNights}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">kun band bo'lgan</p>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${dachaSummary.totalNights > 0 ? Math.round((dachaSummary.bookedNights / dachaSummary.totalNights) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
                <CardBody className="p-6">
                  <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                      Top {labels.unitTypeLabel.toLowerCase()}lari (Daromad bo'yicha)
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Biznesga eng ko'p foyda keltiruvchi top-5 {labels.unitTypeLabel.toLowerCase()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-0">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      <span className="w-6 text-center">#</span>
                      <span>{labels.unitTypeLabel}</span>
                      <span className="text-right">Daromad</span>
                    </div>

                    {unitTypeDistribution.length === 0 ? (
                      <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        Hali bronlar yo'q.
                      </p>
                    ) : (
                      [...unitTypeDistribution]
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 5)
                        .map((r, index) => (
                          <div key={r.id} className="grid grid-cols-[auto_1fr_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                            <span className="text-sm font-mono text-zinc-400 w-6 text-center">{index + 1}</span>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{r.name}</span>
                              <span className="text-xs text-zinc-500 mt-0.5">{r.bookings} ta bron qilingan</span>
                            </div>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white text-right self-center">{formatMoney(r.revenue)}</span>
                          </div>
                        ))
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "finance" && (
        <div className="grid gap-6 md:grid-cols-[1fr_350px] animate-fade-in">
          <div className="flex flex-col gap-6">
            <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Pul yechish tarixi</h2>
                  <button
                    onClick={handleDownloadReport}
                    disabled={reportDownloading}
                    className="text-sm font-medium text-[var(--primary)] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Download size={14} /> {reportDownloading ? "Tayyorlanmoqda..." : "Balans hisoboti"}
                  </button>
                </div>

                {financeLoading ? (
                  <div className="py-12 text-center text-sm text-zinc-500">Yuklanmoqda...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="px-4 py-3 font-medium text-zinc-500">ID</th>
                          <th className="px-4 py-3 font-medium text-zinc-500">Sana</th>
                          <th className="px-4 py-3 font-medium text-zinc-500">Summa</th>
                          <th className="px-4 py-3 font-medium text-zinc-500">Hisob</th>
                          <th className="px-4 py-3 font-medium text-zinc-500">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {withdrawals.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-500">Tarix topilmadi</td></tr>
                        ) : withdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="px-4 py-3 font-mono text-xs text-zinc-500">{w.id}</td>
                            <td className="px-4 py-3">{formatDate(w.requestDate || new Date().toISOString())}</td>
                            <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{formatMoney(w.amount)}</td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-600">{w.bankAccount}</td>
                            <td className="px-4 py-3">
                              {w.status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">To'landi</span>
                              ) : w.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Tasdiqlandi</span>
                              ) : w.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Kutilmoqda</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Rad etilgan</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
              <CardBody className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Balans tarixi</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Har bir daromad, komissiya va qaytarish yozuvi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-lg">
                      <LedgerFilterTab
                        active={ledgerTypeFilter === "all"}
                        onClick={() => setLedgerTypeFilter("all")}
                        label="Barchasi"
                      />
                      {ledgerTypeOptions.map((t) => (
                        <LedgerFilterTab
                          key={t}
                          active={ledgerTypeFilter === t}
                          onClick={() => setLedgerTypeFilter(t)}
                          label={ledgerTypeLabel(t)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLedgerSort((s) => ({
                          sortBy: s.sortBy,
                          order: s.order === "desc" ? "asc" : "desc",
                        }))
                      }
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1"
                      title="Saralash tartibini almashtirish"
                    >
                      Sana {ledgerSort.order === "desc" ? "↓" : "↑"}
                    </button>
                  </div>
                </div>

                {ledgerLoading ? (
                  <div className="py-12 text-center text-sm text-zinc-500">Yuklanmoqda...</div>
                ) : ledgerError ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-sm text-zinc-500">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <p>Balans tarixini yuklab bo'lmadi</p>
                    <button
                      onClick={() => fetchLedger(1, ledgerSort)}
                      className="text-[var(--primary)] font-medium hover:underline"
                    >
                      Qayta urinish
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="px-4 py-3 font-medium text-zinc-500">Sana</th>
                          <th className="px-4 py-3 font-medium text-zinc-500">Turi</th>
                          <th className="px-4 py-3 font-medium text-zinc-500">Bron</th>
                          <th className="px-4 py-3 font-medium text-zinc-500 text-right">Summa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredLedgerEntries.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-500">Yozuvlar topilmadi</td></tr>
                        ) : filteredLedgerEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                {ledgerTypeLabel(entry.type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                              {entry.bookingId ? entry.bookingId.slice(0, 8) : "—"}
                            </td>
                            <td
                              className={cn(
                                "px-4 py-3 text-right font-bold whitespace-nowrap",
                                entry.amount >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {entry.amount >= 0 ? "+" : ""}
                              {formatMoney(entry.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {ledgerHasMore && (
                      <div className="pt-4 flex justify-center">
                        <button
                          onClick={() => fetchLedger(ledgerPage + 1, ledgerSort)}
                          disabled={ledgerLoadingMore}
                          className="text-sm font-medium text-[var(--primary)] hover:underline disabled:opacity-50"
                        >
                          {ledgerLoadingMore ? "Yuklanmoqda..." : "Ko'proq yuklash"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="border-none shadow-sm ring-1 ring-emerald-200/50 bg-emerald-50 dark:bg-emerald-950/20 dark:ring-emerald-900/50">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Wallet size={20} />
                  </div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Joriy Balans</p>
                </div>
                <p className="text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                  {balanceLoading ? "..." : formatMoney(financeOverview?.availableBalance ?? 0)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                  To'liq tasdiqlangan bronlardan tushgan summa (komissiya yechib olinganidan so'ng).
                </p>
              </CardBody>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
              <CardBody className="p-6">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Pul yechish so'rovi</h3>
                <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Summa (UZS)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="any"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Masalan: 5000000"
                      className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hisob raqam / Karta</label>
                    <input
                      type="text"
                      required
                      value={withdrawBank}
                      onChange={(e) => setWithdrawBank(e.target.value)}
                      placeholder="Tranzit hisob yoki Uzcard"
                      className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !(parseFloat(withdrawAmount) > 0) || !withdrawBank}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Yuborilmoqda..." : "So'rov yuborish"}
                  </button>
                  <p className="text-[10px] text-zinc-500 mt-1 text-center">
                    Pul yechish jarayoni 1-3 ish kunigacha vaqt olishi mumkin.
                  </p>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Yordamchi Komponentlar
// ==========================================

function formatShortDate(isoDate: string) {
  const d = new Date(isoDate);
  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  return `${d.getDate()}-${months[d.getMonth()]}`;
}

function TimeTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
        active 
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700/50" 
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/30 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30"
      )}
    >
      {label}
    </button>
  );
}

function LedgerFilterTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
        active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200",
      )}
    >
      {label}
    </button>
  );
}

function ReportMetric({
  label, value, trend, icon, tone = "brand"
}: {
  label: string;
  value: string;
  trend?: { value: number; positive: boolean };
  icon: React.ReactNode;
  tone?: "brand" | "accent" | "warning" | "success" | "danger" | "neutral";
}) {
  const toneMap = {
    neutral: { bg: "bg-zinc-100 dark:bg-zinc-800/60", icon: "text-zinc-500" },
    brand: { bg: "bg-brand-50 dark:bg-brand-900/20", icon: "text-brand-600 dark:text-brand-400" },
    accent: { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "text-indigo-600 dark:text-indigo-400" },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400" },
    success: { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600 dark:text-emerald-400" },
    danger: { bg: "bg-red-50 dark:bg-red-900/20", icon: "text-red-600 dark:text-red-400" },
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-zinc-900 dark:border-zinc-800/60">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{value}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", toneMap.bg, toneMap.icon)}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-5 flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md",
            trend.positive 
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {trend.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.value}%
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">avvalgi davrga nisbatan</span>
        </div>
      )}
    </div>
  );
}
