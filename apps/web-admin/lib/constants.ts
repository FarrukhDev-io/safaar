/* ────────────────────────────────────────────
   Ranglar (TZ: Ko'k #1E3A5F asosiy, Yashil #2ECC71 aksent)
   ──────────────────────────────────────────── */

export const COLORS = {
  primary: "#1E3A5F",
  primaryLight: "#2B5278",
  primaryDark: "#152B47",
  accent: "#2ECC71",
  accentLight: "#5BD992",
  accentDark: "#25A85C",
  danger: "#E74C3C",
  warning: "#F39C12",
  info: "#3498DB",
  purple: "#9B59B6",
} as const;

/* ────────────────────────────────────────────
   Sidebar Menu Items
   ──────────────────────────────────────────── */

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export const SIDEBAR_ITEMS: NavItem[] = [
  {
    label: "Bosh panel",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "Foydalanuvchilar",
    href: "/users",
    icon: "Users",
    children: [
      { label: "Mijozlar", href: "/users", icon: "Users" },
      { label: "Admin Jamoasi", href: "/team", icon: "ShieldCheck" },
    ],
  },
  {
    label: "Hamkorlar",
    href: "/partners",
    icon: "Building2",
    children: [
      { label: "Arizalar", href: "/partners/requests", icon: "FileText" },
      { label: "Ro'yxat", href: "/partners/list", icon: "List" },
      { label: "E'lonlar", href: "/partners/listings", icon: "Megaphone" },
    ],
  },
  {
    label: "Bronlar",
    href: "/bookings",
    icon: "CalendarCheck",
    children: [
      { label: "Turar-joy", href: "/bookings/hotels", icon: "Hotel" },
      { label: "Restoran", href: "/bookings/restaurants", icon: "UtensilsCrossed" },
      { label: "Transport", href: "/bookings/buses", icon: "Bus" },
    ],
  },
  {
    label: "Moliya",
    href: "/finance",
    icon: "Wallet",
    children: [
      { label: "Ko'rinish", href: "/finance/overview", icon: "BarChart3" },
      { label: "Tranzaksiyalar", href: "/finance/payments", icon: "CreditCard" },
      { label: "Qaytarishlar", href: "/finance/refunds", icon: "History" },
      { label: "Pul yechishlar", href: "/finance/withdrawals", icon: "ArrowDownToLine" },
      { label: "Hisobotlar", href: "/finance/reports", icon: "FileSpreadsheet" },
    ],
  },
  {
    label: "Kontent (CMS)",
    href: "/cms",
    icon: "PanelsTopLeft",
    children: [
      { label: "Bannerlar", href: "/cms/banners", icon: "Image" },
      { label: "Takliflar", href: "/cms/offers", icon: "Tag" },
      { label: "Yangiliklar", href: "/cms/news", icon: "Newspaper" },
      { label: "Sahifalar", href: "/cms/pages", icon: "FileText" },
      { label: "Shablonlar", href: "/cms/templates", icon: "Mail" },
      { label: "Xabarnomalar", href: "/cms/broadcasts", icon: "Send" },
    ],
  },
  {
    label: "Katalog",
    href: "/catalog",
    icon: "MapPin",
  },
  {
    label: "Promo-kodlar",
    href: "/promos",
    icon: "Ticket",
  },
  {
    label: "Yordam",
    href: "/support",
    icon: "MessageCircle",
  },
  {
    label: "Sozlamalar",
    href: "/settings",
    icon: "Settings",
  },
  {
    label: "Dasturchi API",
    href: "/developer",
    icon: "Code2",
  },
  {
    label: "Audit jurnali",
    href: "/audit",
    icon: "History",
  },
];

/* ────────────────────────────────────────────
   Status turlari va ranglari
   ──────────────────────────────────────────── */

// NEW-1 FIX: `color` bu yerda `StatusBadge.tsx` orqali matn rangi sifatida
// o'zining O'ZI (`bg`) ustida ishlatiladi -- avval barcha 5 rang (yashil/
// to'q sariq/qizil/ko'k/binafsha) o'zining tegishli 12%-shaffof
// fon-ustidagi matn sifatida atigi ~1.9-4.0:1 kontrast berardi (WCAG AA
// 4.5:1 talabidan past). `bg` (yumshoq, brendga mos rang tovlanishi)
// ATAYLAB o'zgartirilmagan -- faqat `color` (matn/nuqta rangi) xuddi shu
// tondagi ANCHA to'qroq variantga almashtirildi (har biri o'zining `bg`si
// ustida 5.5:1+ berish uchun hisoblangan). E'tibor: `COLORS.accent` va
// boshqa yorqin ranglar (yuqorida, grafiklarda ham) ATAYLAB TEGILMAGAN --
// ular matn emas (tugma/grafik chizig'i kabi grafik elementlar) yoki
// boshqa fonlarda ishlatiladi, shu sabab bu yerdagi muammoga aloqasi yo'q.
export const BOOKING_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Kutilmoqda", color: "#885607", bg: "rgba(243,156,18,0.12)" },
  CONFIRMED: { label: "Tasdiqlangan", color: "#19703E", bg: "rgba(46,204,113,0.12)" },
  CANCELLED: { label: "Bekor qilingan", color: "#B62516", bg: "rgba(231,76,60,0.12)" },
  COMPLETED: { label: "Yakunlangan", color: "#1B6496", bg: "rgba(52,152,219,0.12)" },
  REFUND: { label: "Qaytarilgan", color: "#81449A", bg: "rgba(155,89,182,0.12)" },
};

export const USER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Faol", color: "#19703E", bg: "rgba(46,204,113,0.12)" },
  blocked: { label: "Bloklangan", color: "#B62516", bg: "rgba(231,76,60,0.12)" },
  unverified: { label: "Tasdiqlanmagan", color: "#885607", bg: "rgba(243,156,18,0.12)" },
};

export const PARTNER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Faol", color: "#19703E", bg: "rgba(46,204,113,0.12)" },
  suspended: { label: "To'xtatilgan", color: "#885607", bg: "rgba(243,156,18,0.12)" },
  blocked: { label: "Bloklangan", color: "#B62516", bg: "rgba(231,76,60,0.12)" },
};

export const PARTNER_REQUEST_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Yangi", color: "#885607", bg: "rgba(243,156,18,0.12)" },
  submitted: { label: "Yangi", color: "#885607", bg: "rgba(243,156,18,0.12)" },
  reviewing: { label: "Ko'rib chiqilmoqda", color: "#1B6496", bg: "rgba(52,152,219,0.12)" },
  approved: { label: "Tasdiqlangan", color: "#19703E", bg: "rgba(46,204,113,0.12)" },
  rejected: { label: "Rad etilgan", color: "#B62516", bg: "rgba(231,76,60,0.12)" },
};

export const PAYMENT_METHOD_MAP: Record<string, string> = {
  click: "Click",
  payme: "Payme",
  uzcard: "Uzcard",
  humo: "Humo",
};

export const ACCOMMODATION_TYPE_MAP: Record<string, string> = {
  hotel: "Mehmonxona",
  hostel: "Yotoqxona (Hostel)",
  guesthouse: "Mehmon uyi",
  motel: "Motel",
  dacha: "Dacha",
};

/* ────────────────────────────────────────────
   Viloyatlar
   ──────────────────────────────────────────── */

export const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Buxoro",
  "Xorazm",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Surxondaryo",
  "Qashqadaryo",
  "Navoiy",
  "Jizzax",
  "Sirdaryo",
  "Qoraqalpog'iston",
] as const;

export const CITIES = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Xiva",
  "Urganch",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Termiz",
  "Qarshi",
  "Navoiy",
  "Jizzax",
  "Guliston",
  "Nukus",
  "Kokand",
  "Marg'ilon",
  "Shahrisabz",
] as const;
