import { NextRequest, NextResponse } from "next/server";
import {
  createPartnerRequest,
  findPartnerRequestByPhone,
  listPartnerRequests,
} from "@/lib/partner-requests-store";
import type { PartnerType } from "@/types/admin";

const VALID_PARTNER_TYPES: PartnerType[] = [
  "hotel",
  "bus",
  "hostel",
  "guesthouse",
  "motel",
  "dacha",
  "restaurant",
];

function normalizePartnerType(value: unknown): PartnerType {
  return VALID_PARTNER_TYPES.includes(value as PartnerType) ? (value as PartnerType) : "hotel";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  if (phone) {
    const item = findPartnerRequestByPhone(phone);
    return json({
      found: Boolean(item),
      status: item?.status ?? "not_found",
      request: item,
    });
  }

  return json({ items: listPartnerRequests() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const created = createPartnerRequest({
    companyName: String(body.companyName ?? body.company_name ?? ""),
    type: normalizePartnerType(body.type),
    contactPerson: String(body.contactPerson ?? body.contact_person ?? ""),
    phone: String(body.phone ?? ""),
    email: String(body.email ?? ""),
    city: String(body.city ?? ""),
    address: String(body.address ?? ""),
    taxId: body.taxId ? String(body.taxId) : undefined,
    note: body.note ? String(body.note) : undefined,
  });

  return json({ item: created }, { status: 201 });
}
