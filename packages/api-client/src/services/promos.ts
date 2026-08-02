import { rawApi } from "../client";
import { camelizeKeys } from "../case";
import type { PromoView } from "../types";

export const promosService = {
  /**
   * `GET /promos` — hozir amal qiladigan promo-kodlar (ommaviy).
   * Admin panelda o'zgartirilishi bilan darhol ko'rinishi kerak, shuning
   * uchun keshsiz (`no-store`) so'raladi.
   */
  async listActive(): Promise<PromoView[]> {
    const raw = await rawApi.get<unknown[]>("/promos", { cache: "no-store" });
    return camelizeKeys<PromoView[]>(raw);
  },
};
