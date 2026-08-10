/**
 * Platformadagi foydalanuvchi rollari (RBAC).
 * Bitta backend API uchala panelga ham xizmat qiladi,
 * ruxsatlar shu rollar asosida ajratiladi.
 */
export enum Role {
  /** Mijoz — safaar.uz */
  USER = "USER",
  /** Hamkor (mehmonxona / avtobus kompaniyasi) — partner.safaar.uz */
  PARTNER = "PARTNER",
  /** Platforma administratori — admin.safaar.uz */
  ADMIN = "ADMIN",
  /** Moliya bo'limi administratori */
  FINANCE_ADMIN = "FINANCE_ADMIN",
  /** Kontent/CMS administratori */
  CONTENT_ADMIN = "CONTENT_ADMIN",
  /** Support/operator administratori */
  SUPPORT_ADMIN = "SUPPORT_ADMIN",
  /** Moderatsiya administratori */
  MODERATOR = "MODERATOR",
  /** Super administrator — to'liq nazorat */
  SUPER_ADMIN = "SUPER_ADMIN",
}

export type ActorType = "user" | "partner" | "admin";

/** JWT token ichidagi payload. */
export interface JwtPayload {
  sub: string;
  phone?: string;
  role?: Role;
  actor_type?: ActorType;
  organization_id?: string | null;
  roles?: Role[];
  session_id?: string;
  iat?: number;
  exp?: number;
}

/** Login natijasida qaytadigan tokenlar. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type OAuthProvider = "google" | "yandex" | "telegram" | "apple" | "facebook";

export interface OAuthProviderAvailability {
  google?: boolean;
  yandex?: boolean;
  telegram?: boolean;
  apple?: boolean;
  facebook?: boolean;
}

export interface OAuthExchangeResult {
  tokens?: AuthTokens;
  user?: unknown;
  requiresRegistration?: boolean;
  tempToken?: string;
}
