'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthTokens, Role } from '@safaar/types';
import type { PartnerAccessStatus } from '../_lib/api/endpoints/access';

export const AUTH_STORAGE_KEY = 'safaar-partner-auth';

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  role: Role;
  organizationId?: string;
  partnerType?: string;
  accessStatus?: PartnerAccessStatus;
}

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  setSession: (user: AuthUser, tokens: AuthTokens) => void;
  updateUser: (
    patch: Partial<
      Pick<
        AuthUser,
        | 'fullName'
        | 'phone'
        | 'email'
        | 'partnerType'
        | 'organizationId'
        | 'accessStatus'
      >
    >,
  ) => void;
  clearSession: () => void;
  setAccessToken: (accessToken: string) => void;
}

/**
 * Hamkor sessiyasi.
 *
 * `refreshToken` bu yerda ATAYLAB doim bo'sh satr — haqiqiy refresh token
 * endi `localStorage`ga umuman tushmaydi, u faqat httpOnly cookie'da
 * (`/api/auth/session` uni yozadi, `/api/auth/refresh` uni o'qiydi).
 * `AuthTokens` tipi mos kelishi uchun maydon saqlanib qolgan, lekin
 * qiymati hech qachon real token bo'lmasligi kerak — XSS orqali uzoq
 * muddatli sessiyani o'g'irlab bo'lmasligi shu talab qilingan.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) =>
        set({ user, tokens: { accessToken: tokens.accessToken, refreshToken: '' } }),
      updateUser: (patch) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...patch } } : state,
        ),
      clearSession: () => set({ user: null, tokens: null }),
      setAccessToken: (accessToken) =>
        set((state) =>
          state.tokens ? { tokens: { ...state.tokens, accessToken } } : state,
        ),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: () => ({ user: null, tokens: null }),
    },
  ),
);
