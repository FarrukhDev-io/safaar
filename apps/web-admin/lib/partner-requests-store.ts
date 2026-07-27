import type { PartnerRequest, PartnerRequestStatus, PartnerType } from "@/types/admin";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

type PartnerRequestInput = {
  companyName: string;
  type: PartnerType;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  taxId?: string;
  note?: string;
};

type StoreState = {
  requests: PartnerRequest[];
};

const store = globalThis as typeof globalThis & {
  __uzbronPartnerRequests?: StoreState;
};

const STORE_FILE = join(tmpdir(), "uzbron-web-admin-partner-requests.json");

function readPersisted(): PartnerRequest[] {
  try {
    if (!existsSync(STORE_FILE)) return [];
    const raw = readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as { requests?: PartnerRequest[] };
    return Array.isArray(parsed.requests) ? parsed.requests : [];
  } catch {
    return [];
  }
}

function persist(requests: PartnerRequest[]) {
  try {
    mkdirSync(dirname(STORE_FILE), { recursive: true });
    writeFileSync(STORE_FILE, JSON.stringify({ requests }, null, 2));
  } catch {
    // Dev fallback: memory store still keeps the app usable.
  }
}

function state(): StoreState {
  if (!store.__uzbronPartnerRequests) {
    store.__uzbronPartnerRequests = { requests: readPersisted() };
  }
  return store.__uzbronPartnerRequests;
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return value.trim();
}

export function listPartnerRequests() {
  return [...state().requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findPartnerRequestByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  return state().requests.find((item) => normalizePhone(item.phone) === normalized) ?? null;
}

export function createPartnerRequest(input: PartnerRequestInput) {
  const normalizedPhone = normalizePhone(input.phone);
  const existing = findPartnerRequestByPhone(normalizedPhone);
  const next: PartnerRequest = {
    id: existing?.id ?? `PR-${Date.now().toString().slice(-6)}`,
    companyName: input.companyName,
    type: input.type,
    contactPerson: input.contactPerson,
    phone: normalizedPhone,
    email: input.email,
    city: input.city,
    address: input.address,
    note: input.note ?? (input.taxId ? `STIR: ${input.taxId}` : undefined),
    status: existing?.status === "approved" ? "approved" : "new",
    documents: [
      { name: "STIR / yuridik ma'lumot", type: "tax_certificate", url: "#" },
    ],
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  const current = state();
  current.requests = [next, ...current.requests.filter((item) => item.id !== next.id)];
  persist(current.requests);
  return next;
}

export function setPartnerRequestStatus(id: string, status: PartnerRequestStatus) {
  const current = state();
  current.requests = current.requests.map((item) =>
    item.id === id ? { ...item, status } : item,
  );
  persist(current.requests);
  return current.requests.find((item) => item.id === id) ?? null;
}
