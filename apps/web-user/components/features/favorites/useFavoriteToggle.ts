"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addFavoriteAction,
  removeFavoriteAction,
  type FavoriteTargetType,
} from "@/lib/account/favorites-actions";

export type { FavoriteTargetType };

export interface UseFavoriteToggleOptions {
  targetType: FavoriteTargetType;
  targetId: string;
  initialFavoriteId: string | null;
  authed: boolean;
  loginHref: string;
}

/**
 * Katalog kartalaridagi ❤️ tugmasi uchun umumiy holat — xuddi shu
 * addFavoriteAction/removeFavoriteAction'lardan foydalanadi (FavoriteButton
 * bilan bir xil), ustiga optimistik UI + xatoda orqaga qaytarish qo'shilgan,
 * chunki katalogda bir nechta karta bor va har bosishda server javobini
 * kutish yomon UX beradi.
 */
export function useFavoriteToggle({
  targetType,
  targetId,
  initialFavoriteId,
  authed,
  loginHref,
}: UseFavoriteToggleOptions) {
  const router = useRouter();
  const [favoriteId, setFavoriteId] = useState<string | null>(initialFavoriteId);
  const [isFavorite, setIsFavorite] = useState<boolean>(!!initialFavoriteId);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending || !targetId) return;

    if (!authed) {
      router.push(loginHref);
      return;
    }

    if (isFavorite) {
      const idToRemove = favoriteId;
      if (!idToRemove) return;
      setIsFavorite(false);
      startTransition(async () => {
        const res = await removeFavoriteAction(idToRemove);
        if (res.ok) {
          setFavoriteId(null);
        } else {
          setIsFavorite(true);
          if (res.authRequired) router.push(loginHref);
        }
      });
    } else {
      setIsFavorite(true);
      startTransition(async () => {
        const res = await addFavoriteAction(targetType, targetId);
        if (res.ok && res.id) {
          setFavoriteId(res.id);
        } else {
          setIsFavorite(false);
          if (res.authRequired) router.push(loginHref);
        }
      });
    }
  }

  return { isFavorite, pending, toggle };
}
