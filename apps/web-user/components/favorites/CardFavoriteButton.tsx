"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addFavoriteAction,
  removeFavoriteAction,
} from "@/lib/account/favorites-actions";

export function CardFavoriteButton({
  targetType,
  targetId,
  initialFavoriteId,
  authed,
  loginHref,
}: {
  targetType: "hotel" | "bus";
  targetId: string;
  initialFavoriteId: string | null;
  authed: boolean;
  loginHref: string;
}) {
  const router = useRouter();
  const [favoriteId, setFavoriteId] = useState<string | null>(initialFavoriteId);
  const [pending, startTransition] = useTransition();

  const isFavorite = !!favoriteId;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!authed) {
      router.push(loginHref);
      return;
    }

    startTransition(async () => {
      if (favoriteId) {
        const res = await removeFavoriteAction(favoriteId);
        if (res.ok) {
          setFavoriteId(null);
        } else if (res.authRequired) {
          router.push(loginHref);
        }
      } else {
        const res = await addFavoriteAction(targetType, targetId);
        if (res.ok && res.id) {
          setFavoriteId(res.id);
        } else if (res.authRequired) {
          router.push(loginHref);
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900",
        isFavorite
          ? "border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100/80"
          : "hover:border-slate-350 hover:text-slate-600"
      )}
      aria-label="Add to favorites"
    >
      <Heart 
        className={cn(
          "h-4 w-4 transition-transform duration-300", 
          isFavorite ? "fill-rose-500 stroke-rose-500 scale-110" : ""
        )} 
      />
    </button>
  );
}
