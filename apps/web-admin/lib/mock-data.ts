/**
 * Mock data — barcha sahifalar uchun real'ga yaqin demo ma'lumotlar.
 * Backend API tayyor bo'lganda bu faylni o'chirib, API so'rovlariga almashtiriladi.
 */

import type { BookingStatus } from "@safaar/types";
import type {
  DashboardStat,
  BookingTrend,
  RevenueData,
  ServiceDistribution,
  ActivityLogItem,
  QuickAction,
  AdminManagedUser,
  Partner,
  PartnerRequest,
  AdminHotelBooking,
  AdminBusBooking,
  AdminRestaurantBooking,
  AccommodationPartnerType,
  BookingDetail,
} from "@/types/admin";

/**
 * Deterministik pseudo-random generator (mulberry32).
 *
 * `Math.random()` server va klientda har xil qiymat qaytaradi — bu esa
 * demo ma'lumot to'g'ridan-to'g'ri render qilinganda React hydration
 * mismatch xatosiga olib keladi (server HTML'i bilan klient render'i
 * mos kelmay qoladi). Har bir generatsiya blokini bir xil seed bilan
 * boshlab, natija har doim bir xil ("tasodifiy" ko'rinsa ham) bo'lishini
 * kafolatlaymiz.
 */
function createSeededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ────────────────────────────────────────────
   DASHBOARD
   ──────────────────────────────────────────── */

export const dashboardStats: DashboardStat[] = [
  { label: "Jami foydalanuvchilar", value: "45 230", change: 12.3, icon: "Users", color: "#3498DB" },
  { label: "Faol hamkorlar", value: "320", change: 5.2, icon: "Building2", color: "#2ECC71" },
  { label: "Jami bronlar", value: "12 840", change: 8.7, icon: "CalendarCheck", color: "#9B59B6" },
  { label: "Umumiy daromad", value: "2.4 mlrd", change: 15.1, icon: "Wallet", color: "#1E3A5F" },
  { label: "Komissiya daromadi", value: "312 mln", change: 11.5, icon: "TrendingUp", color: "#F39C12" },
  { label: "Bekor qilingan", value: "487", change: -3.2, icon: "XCircle", color: "#E74C3C" },
];

const randTrend = createSeededRandom(1);
export const bookingTrends: BookingTrend[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`,
    hotels: Math.floor(randTrend() * 80) + 40,
    buses: Math.floor(randTrend() * 50) + 20,
  };
});

export const revenueData: RevenueData[] = [
  { month: "Yan", commission: 28_000_000, partnerPayment: 180_000_000 },
  { month: "Fev", commission: 32_000_000, partnerPayment: 210_000_000 },
  { month: "Mar", commission: 29_000_000, partnerPayment: 195_000_000 },
  { month: "Apr", commission: 38_000_000, partnerPayment: 240_000_000 },
  { month: "May", commission: 45_000_000, partnerPayment: 290_000_000 },
  { month: "Iyun", commission: 52_000_000, partnerPayment: 340_000_000 },
];

export const serviceDistribution: ServiceDistribution[] = [
  { name: "Mehmonxona", value: 68, color: "#1E3A5F" },
  { name: "Avtobus", value: 32, color: "#2ECC71" },
];

export const recentActivities: ActivityLogItem[] = [
  { id: "a1", type: "user_registered", message: "Anvar Karimov ro'yxatdan o'tdi", timestamp: new Date(Date.now() - 120000).toISOString(), icon: "UserPlus" },
  { id: "a2", type: "booking_created", message: "Bron #B-4521 yaratildi — Hotel Samarkand", timestamp: new Date(Date.now() - 300000).toISOString(), icon: "CalendarPlus" },
  { id: "a3", type: "partner_request", message: "Yangi hamkor arizasi: Buxoro Travel MChJ", timestamp: new Date(Date.now() - 600000).toISOString(), icon: "Building" },
  { id: "a4", type: "payment_request", message: "Grand Hotel to'lov so'radi: 15 400 000 so'm", timestamp: new Date(Date.now() - 900000).toISOString(), icon: "Wallet" },
  { id: "a5", type: "booking_cancelled", message: "Bron #B-4518 bekor qilindi", timestamp: new Date(Date.now() - 1200000).toISOString(), icon: "XCircle" },
  { id: "a6", type: "complaint", message: "Yangi shikoyat: To'lov muammosi #T-289", timestamp: new Date(Date.now() - 1800000).toISOString(), icon: "AlertTriangle" },
  { id: "a7", type: "user_registered", message: "Dilnoza Rahimova ro'yxatdan o'tdi", timestamp: new Date(Date.now() - 2400000).toISOString(), icon: "UserPlus" },
  { id: "a8", type: "booking_created", message: "Bron #B-4519 yaratildi — Toshkent-Samarqand avtobus", timestamp: new Date(Date.now() - 3000000).toISOString(), icon: "CalendarPlus" },
  { id: "a9", type: "partner_request", message: "Yangi hamkor arizasi: Comfort Bus MChJ", timestamp: new Date(Date.now() - 3600000).toISOString(), icon: "Building" },
  { id: "a10", type: "booking_created", message: "Bron #B-4517 yaratildi — Hilton Toshkent", timestamp: new Date(Date.now() - 4200000).toISOString(), icon: "CalendarPlus" },
];

export const quickActions: QuickAction[] = [
  { label: "Kutilayotgan hamkor arizalari", count: 5, color: "#F39C12", href: "/partners/requests" },
  { label: "Ko'rib chiqilmagan shikoyatlar", count: 12, color: "#E74C3C", href: "/support" },
  { label: "To'lov so'rovlari", count: 3, color: "#F39C12", href: "/finance/withdrawals" },
  { label: "Bugun yangi foydalanuvchilar", count: 47, color: "#3498DB", href: "/users" },
];

/* ────────────────────────────────────────────
   USERS
   ──────────────────────────────────────────── */

const userNames = [
  "Anvar Karimov", "Dilnoza Rahimova", "Bobur Aliyev", "Nodira Xasanova",
  "Jasur Toshmatov", "Malika Yusupova", "Sardor Qodirov", "Zulfiya Mirzayeva",
  "Otabek Ibragimov", "Hulkar Nurmatova", "Aziz Raximov", "Shoira Umarova",
  "Doston Ergashev", "Kamola Raxmatullayeva", "Ravshan Sobirov", "Nilufar Abdurahmonova",
  "Sherzod Usmonov", "Feruza Holmatova", "Jamshid Nazarov", "Dilorom Tursunova",
  "Sanjar Mahmudov", "Gulnora Karimova", "Ulug'bek Xoliqov", "Maftuna Salimova",
  "Behruz Abdullayev", "Oygul Rashidova", "Mansur Haydarov", "Sevara Ergasheva",
  "Doniyor Qobilov", "Shahlo Mirkomilova",
];

const randUsers = createSeededRandom(2);
export const mockUsers: AdminManagedUser[] = userNames.map((name, i) => ({
  id: `U-${1001 + i}`,
  fullName: name,
  phone: `+998 ${90 + Math.floor(i / 10)} ${String(100 + i * 13).slice(0, 3)} ${String(2000 + i * 37).slice(0, 2)} ${String(10 + i * 7).slice(0, 2)}`,
  email: name.toLowerCase().replace(/ /g, ".").replace(/'/g, "") + "@gmail.com",
  status: i % 7 === 0 ? "blocked" : i % 11 === 0 ? "unverified" : "active" as const,
  bookingsCount: Math.floor(randUsers() * 25),
  totalSpent: Math.floor(randUsers() * 15_000_000),
  bonusBalance: Math.floor(randUsers() * 500_000),
  lastLogin: new Date(Date.now() - randUsers() * 30 * 86400000).toISOString(),
  createdAt: new Date(Date.now() - randUsers() * 365 * 86400000).toISOString(),
}));

/* ────────────────────────────────────────────
   PARTNERS
   ──────────────────────────────────────────── */

const partnerData = [
  { name: "Grand Samarkand Hotel", type: "hotel" as const, city: "Samarqand", rating: 4.7 },
  { name: "Buxoro Palace", type: "hotel" as const, city: "Buxoro", rating: 4.5 },
  { name: "Hilton Tashkent", type: "hotel" as const, city: "Toshkent", rating: 4.9 },
  { name: "City Palace Hotel", type: "hotel" as const, city: "Toshkent", rating: 4.3 },
  { name: "Silk Road Inn", type: "hotel" as const, city: "Xiva", rating: 4.1 },
  { name: "Registan Plaza", type: "hotel" as const, city: "Samarqand", rating: 4.6 },
  { name: "Navruz Hotel", type: "hotel" as const, city: "Namangan", rating: 3.8 },
  { name: "Oasis Hotel", type: "hotel" as const, city: "Nukus", rating: 3.5 },
  { name: "Pearl Fergana", type: "hotel" as const, city: "Farg'ona", rating: 4.0 },
  { name: "Andijan Grand", type: "hotel" as const, city: "Andijon", rating: 3.9 },
];

const randPartners = createSeededRandom(3);
export const mockPartners: Partner[] = partnerData.map((p, i) => ({
  id: `P-${201 + i}`,
  companyName: p.name,
  type: p.type,
  contactPerson: userNames[i] ?? "Nomalum",
  phone: `+998 ${71 + i} ${String(200 + i * 7).slice(0, 3)} ${String(10 + i * 3).slice(0, 2)} ${String(50 + i * 9).slice(0, 2)}`,
  email: p.name.toLowerCase().replace(/ /g, "").replace(/'/g, "") + "@company.uz",
  city: p.city,
  address: `${p.city}, Amir Temur ko'chasi ${10 + i}`,
  commissionPercent: p.type === "hotel" ? 12 + Math.floor(randPartners() * 6) : 8 + Math.floor(randPartners() * 5),
  rating: p.rating,
  totalBookings: Math.floor(randPartners() * 500) + 50,
  totalRevenue: Math.floor(randPartners() * 200_000_000) + 10_000_000,
  status: i % 8 === 0 ? "suspended" : i % 12 === 0 ? "blocked" : "active" as const,
  bankName: "Kapitalbank",
  bankAccount: `20208000${String(10000000 + i * 123456).slice(0, 12)}`,
  bankMfo: "00873",
  createdAt: new Date(Date.now() - randPartners() * 365 * 86400000).toISOString(),
}));

export const mockPartnerRequests: PartnerRequest[] = [
  {
    id: "PR-101",
    companyName: "Buxoro Travel MChJ",
    type: "hotel",
    contactPerson: "Akmal Raximov",
    phone: "+998 93 456 78 90",
    email: "akmal@buxorotravel.uz",
    city: "Buxoro",
    address: "Buxoro, Mustaqillik ko'chasi 45",
    documents: [
      { name: "Litsenziya", type: "license", url: "#" },
      { name: "Soliq guvohnomasi", type: "tax_certificate", url: "#" },
      { name: "Pasport nusxasi", type: "passport", url: "#" },
    ],
    note: "5 yillik tajribamiz bor. 35 xonali mehmonxona.",
    status: "new",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "PR-103",
    companyName: "Qarshi Grand Hotel",
    type: "hotel",
    contactPerson: "Dilshod Tursunov",
    phone: "+998 95 678 90 12",
    email: "dilshod@qarshigrand.uz",
    city: "Qarshi",
    address: "Qarshi, Markaziy ko'cha 8",
    documents: [
      { name: "Litsenziya", type: "license", url: "#" },
      { name: "Soliq guvohnomasi", type: "tax_certificate", url: "#" },
      { name: "Pasport nusxasi", type: "passport", url: "#" },
    ],
    status: "reviewing",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "PR-105",
    companyName: "Termiz Oasis Hotel",
    type: "hotel",
    contactPerson: "Laziz Shermatov",
    phone: "+998 97 654 32 10",
    email: "laziz@termizoasis.uz",
    city: "Termiz",
    address: "Termiz, Al-Xorazmiy ko'chasi 5",
    documents: [
      { name: "Litsenziya", type: "license", url: "#" },
      { name: "Soliq guvohnomasi", type: "tax_certificate", url: "#" },
      { name: "Pasport nusxasi", type: "passport", url: "#" },
    ],
    status: "new",
    createdAt: new Date(Date.now() - 518400000).toISOString(),
  },
];

/* ────────────────────────────────────────────
   Listings (Mehmonxonalar e'lonlari)
   ──────────────────────────────────────────── */

export const mockListings: import("@/types/admin").AdminListing[] = [
  {
    id: "L-101",
    partnerId: "P-101",
    companyName: "Buxoro Travel MChJ",
    hotelName: "Buxoro Grand Hotel",
    city: "Buxoro",
    address: "Buxoro, B. Naqshband ko'chasi 15",
    stars: 4,
    photos: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    description: "Buxoroning qoq markazida joylashgan zamonaviy mehmonxona. Qadimiy obidalarga piyoda borish mumkin. 24/7 xizmat, bepul Wi-Fi va nonushta.",
    amenities: ["wifi", "pool", "restaurant", "parking", "ac"],
    rules: {
      checkInTime: "14:00",
      checkOutTime: "12:00",
      childrenAllowed: true,
      petsAllowed: false,
      smokingAllowed: false,
      cancellationPolicy: "flexible"
    },
    roomsCount: 45,
    status: "under_review",
    submittedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "L-102",
    partnerId: "P-103",
    companyName: "Qarshi Grand Hotel",
    hotelName: "Qarshi City Center",
    city: "Qarshi",
    address: "Qarshi, Islom Karimov ko'chasi 8",
    stars: 3,
    photos: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    description: "Qarshi shahri markazidagi qulay mehmonxona. Biznes va dam olish uchun ideal joy.",
    amenities: ["wifi", "parking", "ac", "tv"],
    rules: {
      checkInTime: "13:00",
      checkOutTime: "11:00",
      childrenAllowed: true,
      petsAllowed: true,
      smokingAllowed: false,
      cancellationPolicy: "moderate"
    },
    roomsCount: 20,
    status: "under_review",
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "L-103",
    partnerId: "P-105",
    companyName: "Termiz Oasis Hotel",
    hotelName: "Oasis Resort Termiz",
    city: "Termiz",
    address: "Termiz, Al-Hakim At-Termiziy ko'chasi 55",
    stars: 5,
    photos: [
      "https://images.unsplash.com/photo-1542314831-c6a4d140b64f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    description: "Hashamatli dam olish maskani. Basseyn, spa va fitnes markaziga ega 5 yulduzli resort.",
    amenities: ["wifi", "pool", "spa", "gym", "restaurant", "bar", "parking"],
    rules: {
      checkInTime: "15:00",
      checkOutTime: "12:00",
      childrenAllowed: true,
      petsAllowed: false,
      smokingAllowed: false,
      cancellationPolicy: "strict"
    },
    roomsCount: 120,
    status: "published",
    submittedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

/* ────────────────────────────────────────────
   Finance (V3)
   ──────────────────────────────────────────── */

export const mockWithdrawals: import("@/types/admin").WithdrawalRequest[] = [
  { id: "W-1001", partnerId: "P-1005", partnerName: "Hotel Uzbekistan", amount: 12500000, requestDate: new Date(Date.now() - 86400000 * 2).toISOString(), status: "pending", bankAccount: "20208000900123456789" },
  { id: "W-1002", partnerId: "P-1012", partnerName: "Buxoro Travel Bus", amount: 8400000, requestDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: "approved", bankAccount: "20208000900987654321" },
  { id: "W-1003", partnerId: "P-1024", partnerName: "Samarqand Darvoza Inn", amount: 4200000, requestDate: new Date(Date.now() - 86400000 * 1).toISOString(), status: "rejected", bankAccount: "20208000900112233445" },
];

export const mockFinanceReports: import("@/types/admin").FinanceReport[] = [
  { id: "R-001", title: "Aprel 2026 hisoboti", period: "2026-04", totalRevenue: 240000000, totalCommission: 38000000, dateGenerated: new Date(Date.now() - 86400000 * 60).toISOString() },
  { id: "R-002", title: "May 2026 hisoboti", period: "2026-05", totalRevenue: 290000000, totalCommission: 45000000, dateGenerated: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "R-003", title: "Iyun 2026 hisoboti", period: "2026-06", totalRevenue: 340000000, totalCommission: 52000000, dateGenerated: new Date().toISOString() },
];

/* ────────────────────────────────────────────
   CMS (V3)
   ──────────────────────────────────────────── */

export const mockCmsBanners: import("@/types/admin").CmsBanner[] = [
  { id: "B-001", title: "Yozgi ta'til uchun 20% chegirma", imageUrl: "/images/banners/summer.jpg", link: "/offers/summer", isActive: true, order: 1 },
  { id: "B-002", title: "Samarqandga avtobus qatnovi", imageUrl: "/images/banners/samarkand.jpg", link: "/buses/samarkand", isActive: true, order: 2 },
  { id: "B-003", title: "Yangi yil aksiyasi", imageUrl: "/images/banners/newyear.jpg", link: "/offers/newyear", isActive: false, order: 3 },
];

export const mockCmsNews: import("@/types/admin").CmsArticle[] = [
  { id: "N-001", title: "Yangi mehmonxonalar qo'shildi", type: "news", slug: "yangi-mehmonxonalar-iyun", status: "published", publishedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "N-002", title: "Toshkent-Xiva yangi avtobus yo'nalishi", type: "news", slug: "toshkent-xiva-avtobus", status: "published", publishedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "N-003", title: "Yozgi aksiya shartlari", type: "offer", slug: "yozgi-aksiya-shartlari", status: "draft", publishedAt: "" },
];

export const mockCmsPages: import("@/types/admin").CmsArticle[] = [
  { id: "P-001", title: "Biz haqimizda", type: "page", slug: "about", status: "published", publishedAt: new Date(Date.now() - 86400000 * 100).toISOString() },
  { id: "P-002", title: "Foydalanish shartlari", type: "page", slug: "terms", status: "published", publishedAt: new Date(Date.now() - 86400000 * 100).toISOString() },
  { id: "P-003", title: "Maxfiylik siyosati", type: "page", slug: "privacy", status: "published", publishedAt: new Date(Date.now() - 86400000 * 100).toISOString() },
];

/* ────────────────────────────────────────────
   Catalog (V3)
   ──────────────────────────────────────────── */

export const mockRegions: import("@/types/admin").CatalogRegion[] = [
  { id: "R-01", name: "Toshkent", hotelsCount: 145, isActive: true },
  { id: "R-02", name: "Samarqand", hotelsCount: 89, isActive: true },
  { id: "R-03", name: "Buxoro", hotelsCount: 112, isActive: true },
  { id: "R-04", name: "Xorazm", hotelsCount: 45, isActive: true },
  { id: "R-05", name: "Farg'ona", hotelsCount: 34, isActive: true },
];

export const mockAmenities: import("@/types/admin").CatalogAmenity[] = [
  { id: "A-01", name: "Bepul Wi-Fi", icon: "Wifi", type: "hotel", isActive: true },
  { id: "A-02", name: "Hovuz", icon: "Waves", type: "hotel", isActive: true },
  { id: "A-03", name: "Avtoturargoh", icon: "Car", type: "hotel", isActive: true },
  { id: "A-04", name: "Konditsioner", icon: "Wind", type: "room", isActive: true },
  { id: "A-05", name: "Televizor", icon: "Tv", type: "room", isActive: true },
];

/* ────────────────────────────────────────────
   Promos (V3)
   ──────────────────────────────────────────── */

export const mockPromos: import("@/types/admin").PromoCode[] = [
  { id: "PR-01", code: "SUMMER20", discountType: "percent", discountValue: 20, usageLimit: 100, usedCount: 45, validUntil: new Date(Date.now() + 86400000 * 30).toISOString(), isActive: true },
  { id: "PR-02", code: "WELCOME50", discountType: "fixed", discountValue: 50000, usageLimit: 500, usedCount: 480, validUntil: new Date(Date.now() + 86400000 * 10).toISOString(), isActive: true },
  { id: "PR-03", code: "NEWYEAR26", discountType: "percent", discountValue: 15, usageLimit: 200, usedCount: 200, validUntil: new Date(Date.now() - 86400000 * 150).toISOString(), isActive: false },
];

/* ────────────────────────────────────────────
   Support (V3)
   ──────────────────────────────────────────── */

export const mockTickets: import("@/types/admin").SupportTicket[] = [
  { id: "T-2001", subject: "To'lov o'tmadi", customerName: "Anvar Karimov", customerType: "user", status: "open", priority: "high", assignee: "Admin Adminov", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: "T-2002", subject: "Yangi xona qo'shishda muammo", customerName: "Hotel Uzbekistan", customerType: "partner", status: "in_progress", priority: "medium", assignee: "Nodir T.", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: "T-2003", subject: "Bronni bekor qilish", customerName: "Dilnoza Rahimova", customerType: "user", status: "closed", priority: "low", assignee: "Admin Adminov", createdAt: new Date(Date.now() - 3600000 * 72).toISOString() },
  { id: "T-2004", subject: "Komissiya miqdori bo'yicha savol", customerName: "Samarqand Darvoza Inn", customerType: "partner", status: "open", priority: "medium", createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
];

export const mockTicketMessages: Record<string, import("@/types/admin").TicketMessage[]> = {
  "T-2001": [
    { id: "M-1", ticketId: "T-2001", senderName: "Anvar Karimov", senderRole: "customer", message: "Assalomu aleykum. Payme orqali to'lov qildim, lekin tizimda bron tasdiqlanmadi. Pul yechilgan.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: "M-2", ticketId: "T-2001", senderName: "Admin Adminov", senderRole: "admin", message: "Vaaleykum assalom Anvar aka. Keltirilgan noqulayliklar uchun uzr so'raymiz. To'lov ID raqamini yoki chek skrinshotini shu yerga yubora olasizmi?", createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString() },
  ],
  "T-2002": [
    { id: "M-3", ticketId: "T-2002", senderName: "Hotel Uzbekistan", senderRole: "customer", message: "Yangi 'Prezident lyuks' xonalarini qo'shishda rasmlarni yuklab bo'lmayapti. Xatolik beryapti.", createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: "M-4", ticketId: "T-2002", senderName: "Nodir T.", senderRole: "admin", message: "Assalomu aleykum. Rasm hajmi 5MB dan oshmasligi kerak. Rasmlaringiz hajmini tekshirib ko'ring, agar muammo hal bo'lmasa, rasmlarni bizga yuboring, o'zimiz qo'shib qo'yamiz.", createdAt: new Date(Date.now() - 3600000 * 23).toISOString() },
  ]
};

/* ────────────────────────────────────────────
   BOOKINGS
   ──────────────────────────────────────────── */

const accommodationPartners: { name: string; type: AccommodationPartnerType }[] = [
  { name: "Grand Samarkand Hotel", type: "hotel" },
  { name: "Hilton Tashkent", type: "hotel" },
  { name: "Buxoro Palace", type: "hotel" },
  { name: "City Palace Hotel", type: "hotel" },
  { name: "Zarafshon Motel", type: "motel" },
  { name: "Yo'lovchi Motel", type: "motel" },
  { name: "Chimyon Tog' Dachasi", type: "dacha" },
  { name: "Sim-Sim Dacha", type: "dacha" },
  { name: "Silk Road Hostel", type: "hostel" },
  { name: "Registan Hostel", type: "hostel" },
  { name: "Oltin Vodiy Mehmon Uyi", type: "guesthouse" },
];

const routes = [
  "Toshkent → Samarqand", "Toshkent → Buxoro", "Samarqand → Buxoro",
  "Toshkent → Farg'ona", "Toshkent → Namangan", "Toshkent → Andijon",
];

const statuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as unknown as BookingStatus[];
const methods = ["click", "payme", "uzcard", "humo"] as const;
const roomTypes = ["Standart", "Deluxe", "Suite", "Family", "Apartament"];
const cities = ["Toshkent", "Samarqand", "Buxoro", "Xiva", "Farg'ona", "Namangan"];

const randHotelBookings = createSeededRandom(4);
export const mockHotelBookings: AdminHotelBooking[] = Array.from({ length: 50 }, (_, i) => {
  const checkIn = new Date(Date.now() + (i - 25) * 86400000);
  const nights = Math.floor(randHotelBookings() * 5) + 1;
  const checkOut = new Date(checkIn.getTime() + nights * 86400000);
  const amount = (Math.floor(randHotelBookings() * 800) + 200) * 1000;
  const commissionPct = 0.12 + randHotelBookings() * 0.06;

  const partner = accommodationPartners[i % accommodationPartners.length];

  return {
    id: `B-${4500 + i}`,
    customerName: userNames[i % userNames.length],
    customerPhone: `+998 9${i % 10} ${String(100 + i).slice(0, 3)} ${String(20 + i).slice(0, 2)} ${String(40 + i).slice(0, 2)}`,
    hotelName: partner.name,
    partnerType: partner.type,
    roomType: roomTypes[i % roomTypes.length],
    checkIn: checkIn.toISOString().split("T")[0],
    checkOut: checkOut.toISOString().split("T")[0],
    nights,
    guests: Math.floor(randHotelBookings() * 3) + 1,
    amount,
    paymentMethod: methods[i % methods.length],
    commission: Math.floor(amount * commissionPct),
    status: statuses[i % statuses.length],
    city: cities[i % cities.length],
    createdAt: new Date(Date.now() - randHotelBookings() * 30 * 86400000).toISOString(),
  };
});

const randBusBookings = createSeededRandom(5);
export const mockBusBookings: AdminBusBooking[] = Array.from({ length: 30 }, (_, i) => {
  const dep = new Date(Date.now() + (i - 15) * 86400000);
  const amount = (Math.floor(randBusBookings() * 150) + 50) * 1000;

  const busNames = ["Comfort Bus", "Sharq Transport", "Buxoro Express"];

  return {
    id: `BB-${3000 + i}`,
    customerName: userNames[(i + 10) % userNames.length],
    customerPhone: `+998 9${(i + 3) % 10} ${String(200 + i).slice(0, 3)} ${String(30 + i).slice(0, 2)} ${String(60 + i).slice(0, 2)}`,
    companyName: busNames[i % busNames.length],
    route: routes[i % routes.length],
    departureDate: dep.toISOString().split("T")[0],
    departureTime: `${String(6 + (i % 14)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    seatNumber: `${Math.floor(randBusBookings() * 40) + 1}`,
    amount,
    paymentMethod: methods[i % methods.length],
    commission: Math.floor(amount * 0.1),
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - randBusBookings() * 30 * 86400000).toISOString(),
  };
});

const restaurantNames = [
  "Chorsu Milliy Taomlar", "Bibixonim Restorani", "Registon Osh Markazi",
];
const tableTypes = ["2 kishilik stol", "4 kishilik stol", "VIP kabina", "Terassa"];
const slotTimes = ["12:00", "13:30", "15:00", "18:00", "19:30", "21:00"];

const randRestaurantBookings = createSeededRandom(6);
export const mockRestaurantBookings: AdminRestaurantBooking[] = Array.from({ length: 24 }, (_, i) => {
  const date = new Date(Date.now() + (i - 12) * 86400000);
  const amount = (Math.floor(randRestaurantBookings() * 300) + 100) * 1000;

  return {
    id: `RB-${5000 + i}`,
    customerName: userNames[(i + 5) % userNames.length],
    customerPhone: `+998 9${(i + 6) % 10} ${String(300 + i).slice(0, 3)} ${String(40 + i).slice(0, 2)} ${String(70 + i).slice(0, 2)}`,
    restaurantName: restaurantNames[i % restaurantNames.length],
    tableType: tableTypes[i % tableTypes.length],
    date: date.toISOString().split("T")[0],
    slotTime: slotTimes[i % slotTimes.length],
    guests: Math.floor(randRestaurantBookings() * 6) + 1,
    amount,
    paymentMethod: methods[i % methods.length],
    commission: Math.floor(amount * 0.1),
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - randRestaurantBookings() * 30 * 86400000).toISOString(),
  };
});

export function getMockBookingDetail(id: string): BookingDetail | null {
  const isHotel = id.startsWith("B-");
  if (isHotel) {
    const booking = mockHotelBookings.find((b) => b.id === id);
    if (!booking) return null;
    return {
      id: booking.id,
      serviceType: "hotel",
      status: booking.status,
      createdAt: booking.createdAt,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerName.toLowerCase().replace(/ /g, ".") + "@gmail.com",
      customerId: "U-" + (1001 + mockHotelBookings.indexOf(booking)),
      hotelName: booking.hotelName,
      hotelAddress: `${booking.city}, Amir Temur ko'chasi`,
      roomType: booking.roomType,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      paymentMethod: booking.paymentMethod,
      totalAmount: booking.amount,
      commission: booking.commission,
      partnerAmount: booking.amount - booking.commission,
      transactionId: `TXN-${new Date(booking.createdAt).getTime().toString(36).toUpperCase()}-${booking.id}`,
      paidAt: booking.createdAt,
      statusHistory: [
        { status: "Yaratildi", timestamp: booking.createdAt },
        { status: "To'lov qilindi", timestamp: new Date(new Date(booking.createdAt).getTime() + 300000).toISOString() },
        { status: "Tasdiqlandi", timestamp: new Date(new Date(booking.createdAt).getTime() + 600000).toISOString() },
      ],
    };
  }
  const isRestaurant = id.startsWith("RB-");
  if (isRestaurant) {
    const booking = mockRestaurantBookings.find((b) => b.id === id);
    if (!booking) return null;
    return {
      id: booking.id,
      serviceType: "restaurant",
      status: booking.status,
      createdAt: booking.createdAt,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerName.toLowerCase().replace(/ /g, ".") + "@gmail.com",
      customerId: "U-" + (1001 + mockRestaurantBookings.indexOf(booking)),
      hotelName: booking.restaurantName,
      hotelAddress: "Toshkent, Amir Temur ko'chasi",
      roomType: booking.tableType,
      checkIn: booking.date,
      guests: booking.guests,
      slotTime: booking.slotTime,
      paymentMethod: booking.paymentMethod,
      totalAmount: booking.amount,
      commission: booking.commission,
      partnerAmount: booking.amount - booking.commission,
      transactionId: `TXN-${new Date(booking.createdAt).getTime().toString(36).toUpperCase()}-${booking.id}`,
      paidAt: booking.createdAt,
      statusHistory: [
        { status: "Yaratildi", timestamp: booking.createdAt },
        { status: "To'lov qilindi", timestamp: new Date(new Date(booking.createdAt).getTime() + 300000).toISOString() },
        { status: "Tasdiqlandi", timestamp: new Date(new Date(booking.createdAt).getTime() + 600000).toISOString() },
      ],
    };
  }
  const booking = mockBusBookings.find((b) => b.id === id);
  if (!booking) return null;
  return {
    id: booking.id,
    serviceType: "bus",
    status: booking.status,
    createdAt: booking.createdAt,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerName.toLowerCase().replace(/ /g, ".") + "@gmail.com",
    customerId: "U-" + (1001 + mockBusBookings.indexOf(booking)),
    companyName: booking.companyName,
    route: booking.route,
    departureDate: booking.departureDate,
    departureTime: booking.departureTime,
    seatNumber: booking.seatNumber,
    paymentMethod: booking.paymentMethod,
    totalAmount: booking.amount,
    commission: booking.commission,
    partnerAmount: booking.amount - booking.commission,
    transactionId: `TXN-${new Date(booking.createdAt).getTime().toString(36).toUpperCase()}-${booking.id}`,
    paidAt: booking.createdAt,
    statusHistory: [
      { status: "Yaratildi", timestamp: booking.createdAt },
      { status: "To'lov qilindi", timestamp: new Date(new Date(booking.createdAt).getTime() + 300000).toISOString() },
      { status: "Tasdiqlandi", timestamp: new Date(new Date(booking.createdAt).getTime() + 600000).toISOString() },
    ],
  };
}

/* ────────────────────────────────────────────
   CURRENT ADMIN (mock logged in user)
   ──────────────────────────────────────────── */

export const currentAdmin = {
  id: "A-001",
  fullName: "Admin Adminov",
  email: "admin@uzbron.uz",
  role: "SUPER_ADMIN" as const,
  avatar: undefined,
};
