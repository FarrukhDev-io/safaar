import { useQuery } from "@tanstack/react-query";
import { catalog } from "../_lib/api";

export function useAmenities() {
  return useQuery({
    queryKey: ["catalog", "amenities"],
    queryFn: () => catalog.listAmenities(),
  });
}
