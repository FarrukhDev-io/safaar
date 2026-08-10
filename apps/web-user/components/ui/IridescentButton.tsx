import React, { useEffect, useRef, useState } from "react";
import styles from "./iridescent-button.module.css";
import { cn } from "@/lib/utils";

export interface IridescentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  autoShine?: boolean;
}

export const IridescentButton = React.forwardRef<
  HTMLButtonElement,
  IridescentButtonProps
>(({ className, children, autoShine = true, ...props }, ref) => {
  const [isShining, setIsShining] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Expose the inner ref
  React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

  useEffect(() => {
    if (!autoShine) return;

    // Initial shine on mount
    const shineTimer1 = setTimeout(() => setIsShining(true), 500);
    const shineTimer2 = setTimeout(() => setIsShining(false), 3000);

    return () => {
      clearTimeout(shineTimer1);
      clearTimeout(shineTimer2);
    };
  }, [autoShine]);

  return (
    <button
      ref={buttonRef}
      className={cn(
        styles.iridescent,
        isShining && styles.shine,
        className
      )}
      {...props}
    >
      {children}
      <span className={styles.dropShadow} />
    </button>
  );
});

IridescentButton.displayName = "IridescentButton";
