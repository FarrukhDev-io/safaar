"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Send,
  Headset,
  HelpCircle,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "operator";
  text: string;
  time: string;
}

function generateMessageId(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `m-${Math.random().toString(36).substring(2, 9)}`;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "bot",
    text: "Assalomu alaykum! 👋 Safaar 24/7 Qo'llab-quvvatlash xizmatiga xush kelibsiz! Sizga qanday yordam bera olaman?",
    time: "12:00",
  },
];

const FAQ_CHIPS = [
  {
    id: "faq-1",
    label: "Dachaga bronni bekor qilsam bo'ladimi?",
    response:
      "Ha, albatta! Bron tafsilotlari sahifasiga o'tib, bekor qilish shartlariga muvofiq 100% qaytarib olishingiz mumkin.",
  },
  {
    id: "faq-2",
    label: "To'lovni qanday qaytarib olaman?",
    response:
      "To'lov bekor qilinganda pul 1-3 bank ish kunida kartangizga qaytariladi yoki Safaar bonus balansiga zudlik bilan tushadi.",
  },
  {
    id: "faq-3",
    label: "Operator bilan bog'lanish",
    response:
      "Operatorga so'rovingiz yuborildi! Tez orada mutaxassisimiz suhbatga qo'shiladi (o'rtacha kutish vaqti: 2 daqiqa).",
  },
];

export function LiveSupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("safaar_chat_messages");
      if (saved) {
        try {
          return JSON.parse(saved) as ChatMessage[];
        } catch {
          /* fallback */
        }
      }
    }
    return INITIAL_MESSAGES;
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, open]);

  // Persist messages
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("safaar_chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Escape key listener & Timer cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open]);

  const handleToggle = useCallback(() => {
    setOpen((v) => {
      const next = !v;
      if (next) setUnreadCount(0);
      return next;
    });
  }, []);

  const addBotResponse = useCallback((text: string) => {
    setIsTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const botMsg: ChatMessage = {
        id: generateMessageId(),
        sender: "bot",
        text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      setOpen((isOpen) => {
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
        return isOpen;
      });
    }, 1000);
  }, []);

  const handleSend = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      sender: "user",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText.trim();
    setInputText("");

    // Bot response logic
    const matchedFaq = FAQ_CHIPS.find(
      (f) => f.label.toLowerCase() === currentInput.toLowerCase()
    );
    if (matchedFaq) {
      addBotResponse(matchedFaq.response);
    } else {
      addBotResponse(
        "Xabaringiz uchun rahmat! So'rovingiz qabul qilindi. Operatorimiz tez orada sizga javob beradi."
      );
    }
  }, [inputText, addBotResponse]);

  const handleFaqClick = useCallback((faq: (typeof FAQ_CHIPS)[0]) => {
    const userMsg: ChatMessage = {
      id: generateMessageId(),
      sender: "user",
      text: faq.label,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    addBotResponse(faq.response);
  }, [addBotResponse]);

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handleToggle}
          aria-label="24/7 Live Support Chat"
          aria-expanded={open}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-blue-500/30 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
        >
          {open ? (
            <X className="h-6 w-6 stroke-[2.5]" />
          ) : (
            <Headset className="h-7 w-7 stroke-[2]" />
          )}

          {/* Unread Badge */}
          {!open && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Modal Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Safaar 24/7 Qo'llab-quvvatlash"
          className="fixed bottom-24 right-4 z-50 flex h-[520px] max-h-[85vh] w-[92vw] sm:w-[380px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200 dark:border-slate-800 dark:bg-slate-900/95 sm:right-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                <Bot className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Safaar Support 24/7
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operator tayyor (Online)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Yopish"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? "rounded-br-xs bg-blue-600 font-medium text-white"
                        : "rounded-bl-xs border border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={`mt-1 block text-[10px] font-normal ${
                        isUser ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>

                  {isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <span className="animate-pulse">Operator yozmoqda...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Chips */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800/80 dark:bg-slate-900/50">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
              Tezkor savollar (Quick FAQ):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FAQ_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleFaqClick(chip)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-xs transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Xabaringizni yozing..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!inputText.trim()}
              className="h-9 w-9 rounded-xl p-0 shrink-0"
              aria-label="Yuborish"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
