"use client";

import { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Message {
  id: string;
  body: string;
  sender_type?: string;
  senderType?: string;
  created_at?: string;
  createdAt?: string;
}

export function BookingChat({
  bookingId,
  token,
}: {
  bookingId: string;
  token?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await api.bookings.getMessages(bookingId, { token });
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await api.bookings.sendMessage(bookingId, text, { token });
      setText("");
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-sm text-slate-500">Xabarlar yuklanmoqda...</div>;
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden h-[400px]">
      <div className="border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <h3 className="font-bold text-slate-900 dark:text-white">Mehmonxona bilan chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500 my-10">
            Hozircha xabarlar yo'q. Mehmonxonaga savollaringizni yuborishingiz mumkin.
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender_type === "USER" || msg.senderType === "USER";
            return (
              <div key={msg.id || idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isUser
                      ? "bg-primary-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-none"
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-slate-100 p-3 dark:border-slate-800 flex gap-2 bg-slate-50 dark:bg-slate-950">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1"
          disabled={sending}
        />
        <Button type="submit" disabled={!text.trim() || sending} size="sm" className="shrink-0 px-3">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
