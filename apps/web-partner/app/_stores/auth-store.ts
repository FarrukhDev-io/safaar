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
 * NOTE: hozircha tokenlar `localStorage`'da saqlanadi (skelet bosqichi).
 * Production'da `refreshToken`'ni httpOnly cookie'ga ko'chiramiz.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
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
