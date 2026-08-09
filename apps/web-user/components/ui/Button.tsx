"use client";

import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { type Variant, type Size, type Rounded, buttonVariants, sizeClasses, roundedClasses } from "./button-variants";
import { cn } from "@/lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  rounded?: Rounded;
  /** Yuklanish holati: spinner ko'rsatadi, tugmani o'chiradi (aria-busy). */
  loading?: boolean;
}

import { IridescentButton } from "./IridescentButton";
import styles from "./iridescent-button.module.css";

export function Button({
  variant = "primary",
  size = "md",
  rounded = "xl",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <IridescentButton
        className={cn(
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
          sizeClasses[size],
          roundedClasses[rounded],
          styles.appleGreen,
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </IridescentButton>
    );
  }

  return (
    <button
      className={buttonVariants({ variant, size, rounded, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
