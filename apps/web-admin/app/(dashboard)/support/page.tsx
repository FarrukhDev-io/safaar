"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminApi } from "@/lib/api/admin-api";
import type { SupportTicket, TicketMessage, TicketStatus } from "@/types/admin";
import { formatDate } from "@/lib/utils";
import { MessageCircle, Search, X, Send, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

const STATUS_MAP = {
  open: { label: "Ochiq", color: "var(--danger)", bg: "rgba(231, 76, 60, 0.1)" },
  in_progress: { label: "Jarayonda", color: "var(--warning)", bg: "rgba(243, 156, 18, 0.1)" },
  closed: { label: "Yopilgan", color: "var(--success)", bg: "rgba(46, 204, 113, 0.1)" },
};

const PRIORITY_MAP = {
  low: { label: "Past", color: "bg-[var(--success)]/10 text-[var(--success)]" },
  medium: { label: "O'rta", color: "bg-[var(--warning)]/10 text-[var(--warning)]" },
  high: { label: "Yuqori", color: "bg-[var(--danger)]/10 text-[var(--danger)] font-bold" },
} as const;

function statusInfo(status: unknown) {
  return status === "in_progress" || status === "closed"
    ? STATUS_MAP[status]
    : STATUS_MAP.open;
}

function priorityInfo(priority: unknown) {
  return priority === "low" || priority === "high"
    ? PRIORITY_MAP[priority]
    : PRIORITY_MAP.medium;
}

function cleanText(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function ticketContactName(ticket: SupportTicket) {
  return cleanText(ticket.contactName) ?? cleanText(ticket.customerName) ?? "Noma'lum mijoz";
}

function ticketBusinessName(ticket: SupportTicket) {
  return (
    cleanText(ticket.hotelName) ??
    cleanText(ticket.businessName) ??
    cleanText(ticket.companyName)
  );
}

function ticketBusinessLabel(ticket: SupportTicket) {
  return ticketBusinessName(ticket) ?? (ticket.customerType === "partner" ? "Obyekt nomi kiritilmagan" : "Mijoz");
}

function ticketTaxLabel(ticket: SupportTicket) {
  const taxId = cleanText(ticket.taxId);
  return taxId ? `STIR: ${taxId}` : ticket.customerType === "partner" ? "STIR kiritilmagan" : undefined;
}

function ticketSubtitle(ticket: SupportTicket) {
  return [ticketBusinessLabel(ticket), ticketTaxLabel(ticket)]
    .filter(Boolean)
    .join(" • ");
}

export default function SupportPage() {
  const [data, setData] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");

  // Drawer
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    AdminApi.getTickets()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setMessagesLoading(true);
    AdminApi.getTicketMessages(ticket.id)
      .then((msgs) => setTicketMessages(msgs))
      .finally(() => setMessagesLoading(false));
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    await AdminApi.updateTicketStatus(ticketId, newStatus);
    const applyStatus = (ticket: SupportTicket) =>
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket;
    setData((prev) => prev.map(applyStatus));
    setSelectedTicket((prev) => (prev ? applyStatus(prev) : null));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || sendingMessage) return;

    setSendingMessage(true);
    try {
      const message = await AdminApi.sendMessage(selectedTicket.id, newMessage);
      setTicketMessages((prev) => [...prev, message]);
      setNewMessage("");
      setData((prev) =>
        prev.map((ticket) =>
          ticket.id === selectedTicket.id ? { ...ticket, status: "in_progress" } : ticket,
        ),
      );
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: "in_progress" } : null,
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // Memoized filters
  const filteredData = useMemo(() => {
    return data.filter((t) => {
      const query = searchQuery.toLowerCase();
      const searchable = [
        t.subject,
        t.customerName,
        t.contactName,
        t.businessName,
        t.hotelName,
        t.companyName,
        t.taxId,
        t.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchSearch = searchable.includes(query);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [data, searchQuery, statusFilter, priorityFilter]);

  // Stats
  const openCount = data.filter((t) => t.status === "open").length;
  const inProgressCount = data.filter((t) => t.status === "in_progress").length;
  const closedCount = data.filter((t) => t.status === "closed").length;
  const selectedTicketSubtitle = selectedTicket ? ticketSubtitle(selectedTicket) : "";

  if (loading) return <div className="flex justify-center p-12"><span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="w-full flex gap-6 animate-fade-in relative h-[calc(100vh-100px)] overflow-hidden">
      
      {/* Left Column: Header + Stats + Main Chat */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-hidden">
        

        {/* Dashboard Stats */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-[var(--border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Ochiq murojaatlar</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{openCount}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[var(--border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Jarayonda</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{inProgressCount}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[var(--border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Hal qilingan</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{closedCount}</h3>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-xl border border-[var(--border)] flex flex-col overflow-hidden shadow-sm">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)] shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-[var(--text-primary)] text-lg">{ticketContactName(selectedTicket)}</h3>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                      className="text-xs font-bold rounded-full px-3 py-1 bg-transparent cursor-pointer border border-[var(--border)] focus:outline-none"
                      style={{ color: statusInfo(selectedTicket.status).color, backgroundColor: statusInfo(selectedTicket.status).bg }}
                    >
                      <option value="open" className="text-black bg-white">Ochiq</option>
                      <option value="in_progress" className="text-black bg-white">Jarayonda</option>
                      <option value="closed" className="text-black bg-white">Yopilgan</option>
                    </select>
                  </div>
                  <p className="text-md font-medium mt-1">{selectedTicket.subject}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {selectedTicketSubtitle}
                    {selectedTicketSubtitle ? " • " : ""}
                    Biriktirilgan: <span className="font-medium text-[var(--primary)]">{selectedTicket.assignee || "Hech kim"}</span>
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[var(--text-muted)] hover:text-black shrink-0">
                  <X size={18} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#f8f9fa]">
                {messagesLoading ? (
                  <div className="flex justify-center p-12"><span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
                ) : ticketMessages.length === 0 ? (
                  <div className="text-center text-sm text-[var(--text-muted)] mt-10">Xabarlar yo'q. Birinchi bo'lib yozing!</div>
                ) : (
                  ticketMessages.map((msg) => {
                    const isAdmin = msg.senderRole === "admin";
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[75%] ${isAdmin ? "self-end" : "self-start"}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs font-bold text-[var(--text-secondary)]">{msg.senderName}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isAdmin ? "bg-[var(--primary)] text-white rounded-tr-none shadow-md" : "bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none shadow-sm"}`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-[var(--border)] bg-white shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Javob yozish..."
                    className="flex-1 px-5 py-3 text-sm rounded-full bg-[var(--bg-tertiary)] border border-transparent focus:bg-white focus:border-[var(--primary)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary-dark)] transition-colors shadow-md shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-10 text-center">
              <MessageCircle size={48} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Murojaat tanlanmagan</h3>
              <p className="max-w-xs">O'ng tomondagi ro'yxatdan biror chiptani tanlang va yozishmani boshlang.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Ticket List (Sidebar bar) */}
      <div className="w-[450px] shrink-0 bg-white rounded-xl border border-[var(--border)] flex flex-col overflow-hidden shadow-sm h-full">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0 flex flex-col gap-3">
          <h3 className="font-bold text-[var(--text-primary)]">Ro'yxat</h3>
          {/* Filters specific to the list */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | TicketStatus)}
              className="px-2 py-1.5 text-xs rounded-lg bg-white border border-[var(--border)] focus:outline-none"
            >
              <option value="all">Barcha holatlar</option>
              <option value="open">Ochiq</option>
              <option value="in_progress">Jarayon</option>
              <option value="closed">Yopilgan</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "all" | "low" | "medium" | "high")}
              className="px-2 py-1.5 text-xs rounded-lg bg-white border border-[var(--border)] focus:outline-none"
            >
              <option value="all">Barcha daraja</option>
              <option value="low">Past</option>
              <option value="medium">O'rta</option>
              <option value="high">Yuqori</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {filteredData.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">Murojaatlar topilmadi</div>
          ) : (
            filteredData.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => handleOpenTicket(ticket)}
                className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedTicket?.id === ticket.id ? 'bg-[var(--primary)]/5 border-[var(--primary)]/30' : 'bg-transparent border-transparent hover:bg-[var(--bg-tertiary)]'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-[var(--primary)] truncate pr-3">{ticketContactName(ticket)}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{formatDate(ticket.createdAt).split(' ')[0]}</span>
                </div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate pr-2">{ticket.subject}</h4>
                <div className="flex justify-between items-end mt-2">
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="text-xs text-[var(--text-secondary)] truncate max-w-[280px]">{ticketBusinessLabel(ticket)}</span>
                    {ticketTaxLabel(ticket) ? (
                      <span className="text-[10px] uppercase text-[var(--text-muted)] truncate max-w-[280px]">{ticketTaxLabel(ticket)}</span>
                    ) : (
                      <span className="text-[10px] uppercase text-[var(--text-muted)]">{ticket.customerType === "user" ? "MIJOZ" : "HAMKOR"}</span>
                    )}
                  </div>
                  <div className="flex gap-1 items-center shrink-0">
                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-[var(--danger)]' : ticket.status === 'in_progress' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`} title={statusInfo(ticket.status).label} />
                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${priorityInfo(ticket.priority).color}`}>
                      {priorityInfo(ticket.priority).label}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
