import { request } from "../client";

export type PartnerAccessStatus = "not_found" | "new" | "reviewing" | "approved" | "rejected" | "submitted";

export interface PartnerApplicationDraft {
  companyName: string;
  type: "hotel" | "bus" | "hostel" | "guesthouse" | "motel" | "dacha" | "restaurant";
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  taxId: string;
  note?: string;
}

export async function submitPartnerApplication(body: PartnerApplicationDraft) {
  const result = await request<{ item: { id: string; status: PartnerAccessStatus } }>(
    "/partners/requests",
    {
      method: "POST",
      body,
    }
  );
  return result;
}

export async function getPartnerAccessStatus(phone: string) {
  const result = await request<{
    found: boolean;
    status: PartnerAccessStatus;
    request?: {
      id: string;
      companyName: string;
      status: PartnerAccessStatus;
      type?: string;
    } | null;
  }>("/partners/requests", {
    searchParams: { phone },
  });
  return result;
}
