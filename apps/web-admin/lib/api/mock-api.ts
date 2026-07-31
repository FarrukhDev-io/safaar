import { mockUsers, mockPartners, mockHotelBookings, mockBusBookings, mockWithdrawals, mockFinanceReports, mockCmsBanners, mockCmsNews, mockCmsPages, mockRegions, mockAmenities, mockPromos, mockTickets, mockTicketMessages, mockPartnerRequests } from "../mock-data";
import {
  AdminManagedUser,
  Partner,
  AdminHotelBooking,
  AccommodationPartnerType,
  PartnerRequest,
  CatalogAmenity,
  CatalogRegion,
  CmsArticle,
  CmsBanner,
  FinanceReport,
  PromoCode,
  SupportTicket,
  TicketMessage,
  WithdrawalRequest,
} from "../../types/admin";
import apiClient from "./client";

// Simulate network delay
const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

async function withFallback<T>(
  request: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch {
    await delay(250);
    return fallback();
  }
}

type BackendPartner = {
  id: string;
  type?: string;
  legal_name?: string;
  brand_name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  status?: string;
  default_commission_rate?: number;
  rating_average?: number;
  bookings_count?: number;
  total_revenue?: number;
  created_at?: string;
  documents?: Array<{ name: string; type: "license" | "tax_certificate" | "passport"; url: string }>;
};

type BackendUser = {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  status?: string;
  bookings_count?: number;
  total_spent?: number;
  bonus_balance?: number;
  last_login_at?: string;
  created_at?: string;
};

type BackendBooking = {
  id: string;
  status?: string;
  total_amount?: number;
  payment_method?: string;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  hotel_name?: string;
  room_type_name?: string;
  partner_type?: string;
  city?: string;
  check_in?: string;
  check_out?: string;
  commission_amount?: number;
  item?: {
    check_in?: string;
    check_out?: string;
    nights?: number;
    adults?: number;
    children?: number;
  };
};

function items<T>(value: T[] | { items?: T[]; data?: T[] }): T[] {
  if (Array.isArray(value)) return value;
  return value.items ?? value.data ?? [];
}

function toPartner(row: BackendPartner): Partner {
  return {
    id: row.id,
    companyName: row.brand_name ?? row.legal_name ?? "Hamkor",
    type: row.type === "bus" ? "bus" : "hotel",
    contactPerson: row.legal_name ?? row.brand_name ?? "Mas'ul shaxs",
    phone: row.phone ?? "",
    email: row.email ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    commissionPercent: row.default_commission_rate ?? 0,
    rating: row.rating_average ?? 0,
    totalBookings: row.bookings_count ?? 0,
    totalRevenue: row.total_revenue ?? 0,
    status:
      row.status === "blocked"
        ? "blocked"
        : row.status === "suspended"
          ? "suspended"
          : "active",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toPartnerRequest(row: BackendPartner): PartnerRequest {
  return {
    id: row.id,
    companyName: row.brand_name ?? row.legal_name ?? "Hamkor arizasi",
    type: row.type === "bus" ? "bus" : "hotel",
    contactPerson: row.legal_name ?? row.brand_name ?? "Mas'ul shaxs",
    phone: row.phone ?? "",
    email: row.email ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    documents: row.documents ?? [],
    status:
      row.status === "approved"
        ? "approved"
        : row.status === "rejected"
          ? "rejected"
          : row.status === "submitted"
            ? "reviewing"
            : "new",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toUser(row: BackendUser): AdminManagedUser {
  return {
    id: row.id,
    fullName: row.full_name ?? "Foydalanuvchi",
    phone: row.phone ?? "",
    email: row.email ?? "",
    status:
      row.status === "blocked"
        ? "blocked"
        : row.status === "unverified"
          ? "unverified"
          : "active",
    bookingsCount: row.bookings_count ?? 0,
    totalSpent: row.total_spent ?? 0,
    bonusBalance: row.bonus_balance ?? 0,
    lastLogin: row.last_login_at ?? row.created_at ?? new Date().toISOString(),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

const ACCOMMODATION_PARTNER_TYPES: AccommodationPartnerType[] = ["hotel", "motel", "hostel", "dacha", "guesthouse"];

function toHotelBooking(row: BackendBooking): AdminHotelBooking {
  return {
    id: row.id,
    customerName: row.customer_name ?? "Mijoz",
    customerPhone: row.customer_phone ?? "",
    hotelName: row.hotel_name ?? "Mehmonxona",
    partnerType: ACCOMMODATION_PARTNER_TYPES.includes(row.partner_type as AccommodationPartnerType)
      ? (row.partner_type as AccommodationPartnerType)
      : "hotel",
    roomType: row.room_type_name ?? "Xona",
    checkIn: row.check_in ?? row.item?.check_in ?? "",
    checkOut: row.check_out ?? row.item?.check_out ?? "",
    nights: row.item?.nights ?? 1,
    guests: (row.item?.adults ?? 1) + (row.item?.children ?? 0),
    amount: row.total_amount ?? 0,
    paymentMethod:
      row.payment_method === "payme" ||
      row.payment_method === "uzcard" ||
      row.payment_method === "humo"
        ? row.payment_method
        : "click",
    commission: row.commission_amount ?? 0,
    status: row.status?.toUpperCase() as AdminHotelBooking["status"],
    city: row.city ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

async function getLocalPartnerRequests(): Promise<PartnerRequest[]> {
  const response = await fetch("/api/partner-requests", { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { items?: PartnerRequest[] };
  return data.items ?? [];
}

function mergeRequests(primary: PartnerRequest[], secondary: PartnerRequest[]) {
  const map = new Map<string, PartnerRequest>();
  for (const item of [...secondary, ...primary]) {
    map.set(item.id, item);
  }
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const MockApi = {
  // Auth
  login: async (username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      return {
        token: "mock-access.demo-admin-id.SUPER_ADMIN",
        user: {
          id: "1",
          name: "Super Admin",
          email: "admin@uzbron.uz",
          role: "SUPER_ADMIN" as const,
        },
      };
    }

    return withFallback(
      async () => {
        const { data } = await apiClient.post("/auth/admin/login", {
          username,
          password,
        });
        if (data.requires_2fa) {
          throw new Error("2FA kerak. Hozircha mock login bilan davom eting.");
        }
        return {
          token: data.accessToken,
          user: {
            id: data.admin?.id ?? "admin",
            name: data.admin?.full_name ?? data.admin?.email ?? "Admin",
            email: data.admin?.email ?? username,
            role: data.admin?.role ?? "SUPER_ADMIN",
          },
        };
      },
      async () => {
        await delay();
        throw new Error("Invalid credentials");
      },
    );
  },

  // Users
  getUsers: async (): Promise<AdminManagedUser[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/users");
        return items<BackendUser>(data).map(toUser);
      },
      () => mockUsers as AdminManagedUser[],
    );
  },

  // Partners
  getPartners: async (): Promise<Partner[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/partners");
        return items<BackendPartner>(data).map(toPartner);
      },
      () => mockPartners as Partner[],
    );
  },

  getPartnerRequests: async (): Promise<PartnerRequest[]> => {
    return withFallback(
      async () => {
        const [localRequests, backend] = await Promise.all([
          getLocalPartnerRequests(),
          apiClient.get("/admin/partners/requests").catch(() => ({ data: { items: [] } })),
        ]);
        const backendRequests = items<BackendPartner>(backend.data).map(toPartnerRequest);
        // Demo seed arizalar (mockPartnerRequests) eng past ustuvorlik bilan
        // qo'shiladi — real backend yoki mahalliy (tmp fayl) manbadan kelgan
        // arizalar bilan id to'qnashsa, ular ustunlik qiladi.
        return mergeRequests(mergeRequests(localRequests, backendRequests), mockPartnerRequests);
      },
      () => mockPartnerRequests,
    );
  },

  approvePartner: async (id: string) => {
    return withFallback(
      async () => {
        const local = await fetch(`/api/partner-requests/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        });
        if (local.ok) return (await local.json()).item;
        const { data } = await apiClient.post(`/admin/partners/${id}/approve`);
        return data;
      },
      () => ({ id, status: "approved" }),
    );
  },

  rejectPartner: async (id: string, reason?: string) => {
    return withFallback(
      async () => {
        const local = await fetch(`/api/partner-requests/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });
        if (local.ok) return (await local.json()).item;
        const { data } = await apiClient.post(`/admin/partners/${id}/reject`, {
          reason,
        });
        return data;
      },
      () => ({ id, status: "rejected", reason }),
    );
  },

  // Bookings
  getBookings: async (): Promise<AdminHotelBooking[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/bookings", {
          params: { service_type: "hotel" },
        });
        return items<BackendBooking>(data).map(toHotelBooking);
      },
      () => mockHotelBookings as AdminHotelBooking[],
    );
  },

  // Generic stats
  getDashboardStats: async () => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/dashboard/overview");
        return {
          totalUsers: data.total_users ?? data.users_count ?? 0,
          totalPartners: data.total_partners ?? data.partners_count ?? 0,
          totalBookings: data.total_bookings ?? data.bookings_count ?? 0,
          revenue: data.revenue ?? data.gross_amount ?? 0,
        };
      },
      () => ({
        totalUsers: mockUsers.length,
        totalPartners: mockPartners.length,
        totalBookings: mockHotelBookings.length + mockBusBookings.length,
        revenue:
          mockHotelBookings
            .filter((b) => b.status !== "CANCELLED")
            .reduce((sum, b) => sum + b.amount, 0) +
          mockBusBookings
            .filter((b) => b.status !== "CANCELLED")
            .reduce((sum, b) => sum + b.amount, 0),
      }),
    );
  },

  // Finance
  getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/withdrawals");
        return items<WithdrawalRequest>(data);
      },
      () => mockWithdrawals as WithdrawalRequest[],
    );
  },
  getFinanceReports: async (): Promise<FinanceReport[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/finance/partners-report");
        return items<FinanceReport>(data);
      },
      () => mockFinanceReports as FinanceReport[],
    );
  },

  // CMS
  getCmsBanners: async (): Promise<CmsBanner[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/cms/banners");
        return items<CmsBanner>(data);
      },
      () => mockCmsBanners as CmsBanner[],
    );
  },
  getCmsNews: async (): Promise<CmsArticle[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/cms/news");
        return items<CmsArticle>(data);
      },
      () => mockCmsNews as CmsArticle[],
    );
  },
  getCmsPages: async (): Promise<CmsArticle[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/cms/pages");
        return items<CmsArticle>(data);
      },
      () => mockCmsPages as CmsArticle[],
    );
  },

  // Catalog
  getRegions: async (): Promise<CatalogRegion[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/catalog/regions");
        return items<CatalogRegion>(data);
      },
      () => mockRegions as CatalogRegion[],
    );
  },
  getAmenities: async (): Promise<CatalogAmenity[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/catalog/amenities");
        return items<CatalogAmenity>(data);
      },
      () => mockAmenities as CatalogAmenity[],
    );
  },

  // Promos
  getPromos: async (): Promise<PromoCode[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/promos");
        return items<PromoCode>(data);
      },
      () => mockPromos as PromoCode[],
    );
  },

  // Support
  getTickets: async (): Promise<SupportTicket[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get("/admin/support/tickets");
        return items<SupportTicket>(data);
      },
      () => mockTickets as SupportTicket[],
    );
  },
  getTicketMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    return withFallback(
      async () => {
        const { data } = await apiClient.get(`/admin/support/tickets/${ticketId}`);
        return data.messages ?? [];
      },
      () => mockTicketMessages[ticketId] || [],
    );
  },
};
