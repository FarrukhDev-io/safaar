"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Tracks every currently-open <Modal> instance, in open order, so that when
// modals are stacked (e.g. a confirmation dialog opened on top of a detail
// drawer) Escape only closes the TOPMOST one — each instance's `document`
// keydown listener checks this stack before calling its own onClose, instead
// of every open modal reacting to the same Escape keypress independently.
const openModalStack: string[] = [];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: ModalProps) {
  const instanceId = useId();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Register/unregister this instance on the shared open-modal stack — kept
  // separate from the Escape-listener effect below so re-registering on
  // every onClose identity change (an inline arrow function in most callers)
  // doesn't also churn this instance's stack position.
  useEffect(() => {
    if (!open) return;
    openModalStack.push(instanceId);
    return () => {
      const index = openModalStack.lastIndexOf(instanceId);
      if (index !== -1) openModalStack.splice(index, 1);
    };
  }, [open, instanceId]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Only the topmost open modal (the one opened most recently, e.g. a
      // confirmation dialog stacked on top of a detail drawer) responds —
      // otherwise every open modal would close on the same keypress.
      if (openModalStack[openModalStack.length - 1] !== instanceId) return;
      onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, instanceId]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: "overlayShow 200ms ease-out" }}
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
          sizeStyles[size],
          "bg-white rounded-2xl shadow-xl",
          "flex flex-col max-h-[85vh]"
        )}
        style={{ animation: "contentShow 250ms ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
