import { Hotel, Bus, Home, Bed, Trees, MapPin, UtensilsCrossed } from 'lucide-react';
import React from 'react';

export type ExtendedPartnerType =
  | 'hotel'
  | 'bus'
  | 'hostel'
  | 'guesthouse'
  | 'motel'
  | 'dacha'
  | 'restaurant'
  | string;

export function PartnerTypeDisplay({ type }: { type: ExtendedPartnerType }) {
  let icon = <MapPin size={14} className="text-[var(--text-muted)]" />;
  let label = type;

  switch (type) {
    case 'hotel':
      icon = <Hotel size={14} className="text-[var(--primary)]" />;
      label = 'Mehmonxona';
      break;
    case 'hostel':
      icon = <Bed size={14} className="text-[var(--warning)]" />;
      label = 'Yotoqxona (Hostel)';
      break;
    case 'guesthouse':
      icon = <Home size={14} className="text-[var(--success)]" />;
      label = 'Mehmon uyi';
      break;
    case 'motel':
      icon = <Hotel size={14} className="text-[var(--accent)]" />;
      label = 'Motel';
      break;
    case 'dacha':
      icon = <Trees size={14} className="text-[var(--primary)]" />;
      label = 'Dacha';
      break;
    case 'bus':
      icon = <Bus size={14} className="text-[var(--info)]" />;
      label = 'Avtobus';
      break;
    case 'restaurant':
      icon = <UtensilsCrossed size={14} className="text-[var(--accent)]" />;
      label = 'Restoran';
      break;
    default:
      label = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Noma'lum";
      break;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {icon} {label}
    </span>
  );
}
