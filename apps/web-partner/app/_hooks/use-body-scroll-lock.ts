"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

function lock() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
  }
}

/**
 * Dialog/Drawer/Command palette kabi bir nechta overlay bir vaqtda ochiq
 * bo'lishi mumkin bo'lgan holatlarda `document.body.style.overflow`ni
 * xavfsiz boshqaradi (reference-counted lock). Har bir overlay o'zining
 * `document.body.style.overflow`ni saqlab-tiklashi bir-birini bosib
 * o'tib, sahifa skrolini butunlay "hidden"da qotirib qo'yishi mumkin edi.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock();
  }, [active]);
}
