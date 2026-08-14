import { request } from "../client";

export interface CatalogAmenity {
  id: string;
  code: string;
  name: Record<string, string>;
  icon: string;
  type: string;
  is_active: boolean;
}

export function listAmenities(): Promise<CatalogAmenity[]> {
  return request<CatalogAmenity[]>('/catalog/amenities');
}
