import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DesignMode = "classic" | "modern";

interface DesignStore {
  designMode: DesignMode;
  toggleMode: () => void;
  setMode: (mode: DesignMode) => void;
}

export const useDesignStore = create<DesignStore>()(
  persist(
    (set) => ({
      designMode: "classic",
      toggleMode: () =>
        set((state) => ({
          designMode: state.designMode === "classic" ? "modern" : "classic",
        })),
      setMode: (mode) => set({ designMode: mode }),
    }),
    {
      name: "safaar-design-mode", // localStorage'ga saqlanadi (refresh'dan keyin ham saqlanadi)
    },
  ),
);
