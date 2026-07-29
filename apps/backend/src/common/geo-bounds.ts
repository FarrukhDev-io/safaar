import { BadRequestException } from '@nestjs/common';

export interface GeoBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export function parseGeoBounds(value: unknown): GeoBounds | undefined {
  const raw = firstValue(value);
  if (!raw) return undefined;

  const parts = raw.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    throw new BadRequestException({
      code: 'GEO_BOUNDS_INVALID',
      message: 'bounds formati: sw_lat,sw_lng,ne_lat,ne_lng',
    });
  }

  const [swLat, swLng, neLat, neLng] = parts;
  if (!validLatitude(swLat) || !validLatitude(neLat)) {
    throw new BadRequestException({
      code: 'GEO_BOUNDS_LATITUDE_INVALID',
      message: 'Latitude -90 va 90 oraligida bo‘lishi kerak',
    });
  }
  if (!validLongitude(swLng) || !validLongitude(neLng)) {
    throw new BadRequestException({
      code: 'GEO_BOUNDS_LONGITUDE_INVALID',
      message: 'Longitude -180 va 180 oraligida bo‘lishi kerak',
    });
  }
  if (swLat > neLat) {
    throw new BadRequestException({
      code: 'GEO_BOUNDS_ORDER_INVALID',
      message: 'sw_lat ne_lat dan kichik yoki teng bo‘lishi kerak',
    });
  }

  return {
    south: swLat,
    west: swLng,
    north: neLat,
    east: neLng,
  };
}

function firstValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstValue(value[0]);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function validLatitude(value: number): boolean {
  return value >= -90 && value <= 90;
}

function validLongitude(value: number): boolean {
  return value >= -180 && value <= 180;
}
