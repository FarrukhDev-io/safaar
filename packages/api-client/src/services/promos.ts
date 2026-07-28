import { rawApi } from "../client";
import { camelizeKeys } from "../case";
import type { PromoView } from "../types";

export const promosService = {
  /** `GET /promos` — hozir amal qiladigan promo-kodlar (ommaviy). */
  async listActive(): Promise<PromoView[]> {
    const raw = await rawApi.get<unknown[]>("/promos");
    return camelizeKeys<PromoView[]>(raw);
  },
};
