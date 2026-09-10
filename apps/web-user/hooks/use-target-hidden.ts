"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Returns true if the DOM element with the given ID is NOT visible in the viewport.
 * When the element is scrolled out of view, returns true.
 * When the element is visible in the viewport, returns false.
 */
export function useIsTargetHidden(
  targetId: string,
  rootMargin = "0px 0px -64px 0px",
  threshold = 0
): boolean {
  const isClient = useIsClient();
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!isClient || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const setupObserver = () => {
      const target = document.getElementById(targetId);
      if (!target) return false;

      observer = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        },
        {
          rootMargin,
          threshold,
        }
      );

      observer.observe(target);
      return true;
    };

    if (!setupObserver()) {
      timer = setTimeout(setupObserver, 150);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [targetId, rootMargin, threshold, isClient]);

  if (!isClient) return false;

  return !isIntersecting;
}
