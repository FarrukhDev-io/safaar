/**
 * Hamkor turi (partnerType) bo'yicha UI terminologiyasi.
 *
 * Barcha sahifalarda terminologiyani ulashish uchun markaziy joy.
 * Yangi hamkor turi qo'shilganda shu fayldagina qo'shish kifoya.
 */

export interface PartnerLabels {
  /** Bosh sahifa nomi */
  dashboardTitle: string;
  /** Bosh sahifa ko'zcha matni */
  dashboardEyebrow: string;
  /** Xona / joy birligi, birlik */
  unitSingular: string;
  /** Xona / joy birligi, ko'plik */
  unitPlural: string;
  /** Xona / joy qo'shish tugmasi matni */
  addUnitLabel: string;
  /** Bron / chipta / band qilish */
  reservationLabel: string;
  /** Rezervatsiyalar sahifasi nomi */
  reservationsTitle: string;
  /** Topbar subtitle */
  topbarSubtitle: string;
  /** Kalendar sahifasi sarlavhasi */
  calendarTitle: string;
  /** Kalendar sahifasi tavsifi */
  calendarDescription: string;
  /** Xonalar sahifasi sarlavhasi */
  unitsPageTitle: string;
  /** Xonalar sahifasi tavsifi */
  unitsPageDescription: string;
  /** Listing (e'lon) sahifasi nomi */
  listingTitle: string;
  /** Check-in termini */
  checkInLabel: string;
  /** Check-out termini */
  checkOutLabel: string;
  /** Mijoz yoki yo'lovchi */
  guestLabel: string;
  /** Front desk sarlavhasi */
  frontDeskTitle: string;
  /** Front desk tavsifi */
  frontDeskDescription: string;
  /** Xona haritasi yoki boshqa */
  unitsMapTitle: string;
  /** xonalar/joylar mavjudligini ko'rsatadigan */
  availabilityLabel: string;
  /** Tashkilot turi belgisi (mehmonxona yulduzlar uchun) */
  entityTypeLabel: string;
  /** Xona turi yoki tovar turi */
  unitTypeLabel: string;
  /** Xona turlari sarlavhasi */
  unitTypesTitle: string;
  /** Yangi bron qo'shish */
  newBookingLabel: string;
  /** Walk-in dialog sarlavhasi */
  walkInTitle: string;
  /** Xonalar xaritasida guruhlash birligi (qavat/zal), birlik shaklda */
  floorSingular: string;
}

const HOTEL_LABELS: PartnerLabels = {
  dashboardTitle: "Front Desk",
  dashboardEyebrow: "Bugungi navbat",
  unitSingular: "xona",
  unitPlural: "xonalar",
  addUnitLabel: "Yangi xona qo'shish",
  reservationLabel: "Bron",
  reservationsTitle: "Bronlar",
  topbarSubtitle: "Mehmonxona boshqaruv paneli",
  calendarTitle: "Xona Bandlik Kalendari",
  calendarDescription: "Har bir xona bo'yicha bandlik, to'lov va kelish-ketish sanalarini kuzating.",
  unitsPageTitle: "Xonalar Xaritasi",
  unitsPageDescription: "Mehmonxonadagi barcha xonalarning qavatma-qavat joylashuvi.",
  listingTitle: "Mehmonxona E'loni",
  checkInLabel: "Kirish (Check-in)",
  checkOutLabel: "Chiqish (Check-out)",
  guestLabel: "Mehmon",
  frontDeskTitle: "Front Desk",
  frontDeskDescription: "Bugungi vazifalar va navbat.",
  unitsMapTitle: "Xona Xaritasi",
  availabilityLabel: "E'londagi xonalar",
  entityTypeLabel: "Yulduzlar",
  unitTypeLabel: "Xona turi",
  unitTypesTitle: "Xona Turlari",
  newBookingLabel: "Yangi bron",
  walkInTitle: "Walk-in bron",
  floorSingular: "qavat",
};

const DACHA_LABELS: PartnerLabels = {
  dashboardTitle: "Dacha Boshqaruvi",
  dashboardEyebrow: "Bugungi holat",
  unitSingular: "dacha",
  unitPlural: "dachalar",
  addUnitLabel: "Dacha qo'shish",
  reservationLabel: "Band qilish",
  reservationsTitle: "Band qilishlar",
  topbarSubtitle: "Dacha boshqaruv paneli",
  calendarTitle: "Dacha Bandlik Kalendari",
  calendarDescription: "Dachaingizning band va bo'sh kunlarini kuzating.",
  unitsPageTitle: "Dacha Ma'lumotlari",
  unitsPageDescription: "Dacha xususiyatlari va parametrlarini boshqaring.",
  listingTitle: "Dacha E'loni",
  checkInLabel: "Kelish sanasi",
  checkOutLabel: "Ketish sanasi",
  guestLabel: "Mehmon",
  frontDeskTitle: "Dacha Boshqaruvi",
  frontDeskDescription: "Bugungi band qilishlar va vazifalar.",
  unitsMapTitle: "Dacha Bandlik",
  availabilityLabel: "Dacha holati",
  entityTypeLabel: "Xususiyatlar",
  unitTypeLabel: "Xona",
  unitTypesTitle: "Xona Turlari",
  newBookingLabel: "Yangi band qilish",
  walkInTitle: "Bevosita band qilish",
  floorSingular: "qavat",
};

const HOSTEL_LABELS: PartnerLabels = {
  dashboardTitle: "Front Desk",
  dashboardEyebrow: "Bugungi navbat",
  unitSingular: "yotoq (joy)",
  unitPlural: "yotoqlar (joylar)",
  addUnitLabel: "Yangi yotoq qo'shish",
  reservationLabel: "Band qilish",
  reservationsTitle: "Band qilishlar",
  topbarSubtitle: "Hostel boshqaruv paneli",
  calendarTitle: "Yotoq Bandlik Kalendari",
  calendarDescription: "Har bir yotoq/joy bo'yicha bandlik va kelish-ketishlarni kuzating.",
  unitsPageTitle: "Yotoqlar Xaritasi",
  unitsPageDescription: "Hosteldagi barcha yotoq va joylarning joylashuvi.",
  listingTitle: "Hostel E'loni",
  checkInLabel: "Kirish",
  checkOutLabel: "Chiqish",
  guestLabel: "Mehmon",
  frontDeskTitle: "Front Desk",
  frontDeskDescription: "Bugungi band qilishlar va vazifalar.",
  unitsMapTitle: "Yotoqlar Xaritasi",
  availabilityLabel: "E'londagi joylar",
  entityTypeLabel: "Xususiyatlar",
  unitTypeLabel: "Xona / Dormitory turi",
  unitTypesTitle: "Xona / Dormitory Turlari",
  newBookingLabel: "Yangi band qilish",
  walkInTitle: "Bevosita band qilish",
  floorSingular: "qavat",
};

const BUS_LABELS: PartnerLabels = {
  dashboardTitle: "Mashina Ijarasi",
  dashboardEyebrow: "Bugungi ijaralar va qaytarishlar",
  unitSingular: "mashina",
  unitPlural: "mashinalar",
  addUnitLabel: "Yangi mashina qo'shish",
  reservationLabel: "Ijara bron qilish",
  reservationsTitle: "Mashina ijaralari",
  topbarSubtitle: "Rent Car boshqaruv paneli",
  calendarTitle: "Mashinalar Bandligi",
  calendarDescription: "Mashinalarning ijara sanalari va bandlik holatini kuzating.",
  unitsPageTitle: "Avtopark (Mashinalar)",
  unitsPageDescription: "Kompaniyangizdagi barcha ijaraga beriladigan mashinalar ro'yxati.",
  listingTitle: "Rent Car E'loni",
  checkInLabel: "Olib ketish vaqti",
  checkOutLabel: "Qaytarish vaqti",
  guestLabel: "Mijoz (Haydovchi)",
  frontDeskTitle: "Ijara Boshqaruvi",
  frontDeskDescription: "Bugungi ijaraga beriladigan va qaytadigan mashinalar.",
  unitsMapTitle: "Avtopark",
  availabilityLabel: "Bo'sh mashinalar",
  entityTypeLabel: "Mashina toifalari",
  unitTypeLabel: "Mashina klassi",
  unitTypesTitle: "Mashina Klasslari",
  newBookingLabel: "Yangi ijara bronsi",
  walkInTitle: "Joyida ijaraga berish",
  floorSingular: "sektor",
};

const RESTAURANT_LABELS: PartnerLabels = {
  dashboardTitle: "Bugungi Bronlar",
  dashboardEyebrow: "Bugungi navbat",
  unitSingular: "stol",
  unitPlural: "stollar",
  addUnitLabel: "Yangi stol qo'shish",
  reservationLabel: "Bron",
  reservationsTitle: "Bronlar",
  topbarSubtitle: "Restoran boshqaruv paneli",
  calendarTitle: "Kunlik Jadval",
  calendarDescription: "Bugungi stollar va vaqt-slotlar bo'yicha bandlikni kuzating.",
  unitsPageTitle: "Stollar Xaritasi",
  unitsPageDescription: "Restorandagi barcha stollarning joylashuvi va sig'imi.",
  listingTitle: "Restoran E'loni",
  checkInLabel: "Ochilish vaqti",
  checkOutLabel: "Yopilish vaqti",
  guestLabel: "Mehmon",
  frontDeskTitle: "Bugungi Bronlar",
  frontDeskDescription: "Bugungi rezervatsiyalar va navbat.",
  unitsMapTitle: "Stollar Xaritasi",
  availabilityLabel: "Bo'sh stollar",
  entityTypeLabel: "Taom turi",
  unitTypeLabel: "Stol sig'imi (necha kishilik)",
  unitTypesTitle: "Stol Sig'imlari",
  newBookingLabel: "Yangi bron",
  walkInTitle: "Bevosita bron",
  floorSingular: "zal",
};

const GUESTHOUSE_LABELS: PartnerLabels = {
  ...HOTEL_LABELS,
  topbarSubtitle: "Mehmon uyi boshqaruv paneli",
  dashboardTitle: "Mehmon Uyi Boshqaruvi",
  listingTitle: "Mehmon Uyi E'loni",
  calendarDescription: "Har bir xona bo'yicha bandlik va kelish-ketishlarni kuzating.",
};

const MOTEL_LABELS: PartnerLabels = {
  ...HOTEL_LABELS,
  topbarSubtitle: "Motel boshqaruv paneli",
  listingTitle: "Motel E'loni",
};

const LABELS_MAP: Record<string, PartnerLabels> = {
  hotel: HOTEL_LABELS,
  dacha: DACHA_LABELS,
  hostel: HOSTEL_LABELS,
  bus: BUS_LABELS,
  guesthouse: GUESTHOUSE_LABELS,
  motel: MOTEL_LABELS,
  restaurant: RESTAURANT_LABELS,
  mixed: HOTEL_LABELS,
};

/**
 * Hamkor turini qaytaradi; agar topilmasa, hotel standartini qaytaradi.
 */
export function getPartnerLabels(partnerType?: string | null): PartnerLabels {
  const type = (partnerType ?? "hotel").toLowerCase();
  return LABELS_MAP[type] ?? HOTEL_LABELS;
}

/**
 * Sidebar va boshqa komponentlar uchun partnerType'ning hamkor turi tekshiruvi.
 */
export function hasRooms(partnerType?: string | null): boolean {
  const type = (partnerType ?? "hotel").toLowerCase();
  // Dacha — xona boshqaruvi shart emas, butun boshli obyekt bir yurt.
  return type !== "dacha";
}

export function hasBuses(partnerType?: string | null): boolean {
  return (partnerType ?? "hotel").toLowerCase() === "bus";
}

export function isDacha(partnerType?: string | null): boolean {
  return (partnerType ?? "hotel").toLowerCase() === "dacha";
}

/** Hostel — dormitory xonalar ichida alohida yotoqlar bo'yicha band qilinadi. */
export function hasBeds(partnerType?: string | null): boolean {
  return (partnerType ?? "hotel").toLowerCase() === "hostel";
}

/** Yulduzli tasniflash faqat mehmonxona-uslubidagi obyektlarga tegishli. */
export function hasStarRating(partnerType?: string | null): boolean {
  const type = (partnerType ?? "hotel").toLowerCase();
  return type === "hotel" || type === "motel" || type === "guesthouse" || type === "mixed";
}

/** Restoran — bron kecha-oralig'i emas, kun ichidagi vaqt-slot asosida. */
export function isRestaurant(partnerType?: string | null): boolean {
  return (partnerType ?? "hotel").toLowerCase() === "restaurant";
}

/** Vaqt-slot asosida band qilinadigan hamkor turlari (hozircha faqat restoran). */
export function hasTimeSlots(partnerType?: string | null): boolean {
  return isRestaurant(partnerType);
}
