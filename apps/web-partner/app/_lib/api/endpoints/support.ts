import { request } from "../client";

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "partner" | "admin";
  sender_id: string;
  body: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "closed";
  created_at: string;
  updated_at: string;
  messages?: SupportMessage[];
}

export function listTickets(token?: string | null) {
  return request<SupportTicket[]>("/support/tickets", { token });
}

export function createTicket(
  body: { subject: string; priority: SupportTicket["priority"] },
  token?: string | null,
) {
  return request<SupportTicket>("/support/tickets", {
    method: "POST",
    body,
    token,
  });
}

export function getTicket(id: string, token?: string | null) {
  return request<SupportTicket>(`/support/tickets/${encodeURIComponent(id)}`, {
    token,
  });
}

export function sendMessage(
  id: string,
  body: string,
  token?: string | null,
) {
  return request<SupportMessage>(
    `/support/tickets/${encodeURIComponent(id)}/messages`,
    {
      method: "POST",
      body: { body },
      token,
    },
  );
}
