"use client";

import React from "react";
import { UniversalCard, type UniversalCardProps } from "./UniversalCard";

export type BaseCardProps = {
  imageSrc?: string | null;
  imageAlt?: string;
  badge?: React.ReactNode;          // Rasm ustidagi badge (e.g. Discount tag)
  topRight?: React.ReactNode;       // Rasm ustidagi o'ng tugma
  title: React.ReactNode;           // Katta sarlavha
  subInfo?: React.ReactNode;        // Joylashuv (e.g. 📍 Toshkent)
  rating?: React.ReactNode;         // Reyting yoki teglar
  footerLeft?: React.ReactNode;     // Pastki chap qism (Narx)
  footerRight?: React.ReactNode;    // Pastki o'ng qism (Tugma)
  href?: string;                    // Link o'rami (optional)
  onClick?: () => void;
  className?: string;
  variant?: "default" | "overlay";
};

export function BaseCard({
  imageSrc,
  imageAlt,
  badge,
  topRight,
  title,
  subInfo,
  rating,
  footerLeft,
  footerRight,
  href,
  onClick,
  className,
  variant,
}: BaseCardProps) {
  return (
    <UniversalCard
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      topLeft={badge}
      topRight={topRight}
      title={title}
      location={subInfo}
      tags={rating}
      footerLeft={footerLeft}
      footerRight={footerRight}
      href={href}
      onClick={onClick}
      className={className}
      variant={variant}
    />
  );
}

export * from "./UniversalCard";
