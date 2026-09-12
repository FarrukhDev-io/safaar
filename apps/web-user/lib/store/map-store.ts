import { create } from "zustand";

interface MapState {
  // Xarita ko'rinayotgan burchaklari (Bounding Box)
  // [southWestLng, southWestLat, northEastLng, northEastLat]
  boundingBox: [number, number, number, number] | null;
  setBoundingBox: (bbox: [number, number, number, number] | null) => void;

  // Sichqoncha olib borilganda qaysi mehmonxona aktivlashgani
  hoveredHotelId: string | null;
  setHoveredHotelId: (id: string | null) => void;
}

/**
 * Xarita va vaqtinchalik UI holatlarini boshqarish uchun Zustand store.
 * Bu state URL ga darhol yozilishi shart bo'lmagan, tez o'zgaruvchan 
 * holatlar (masalan, hover yoki xaritani surish) uchun mo'ljallangan.
 */
export const useMapStore = create<MapState>((set) => ({
  boundingBox: null,
  setBoundingBox: (bbox) => set({ boundingBox: bbox }),

  hoveredHotelId: null,
  setHoveredHotelId: (id) => set({ hoveredHotelId: id }),
}));
