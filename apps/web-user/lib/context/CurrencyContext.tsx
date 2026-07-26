"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  CurrencyCode,
  DEFAULT_EXCHANGE_RATES,
  formatMoney,
  CURRENCY_INFO,
} from "@/lib/utils/money";

interface CurrencyContextType {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  setCurrency: (code: CurrencyCode) => void;
  format: (amountInSum: number) => string;
  currencyInfo: typeof CURRENCY_INFO[CurrencyCode];
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "UZS",
  rates: DEFAULT_EXCHANGE_RATES,
  setCurrency: () => {},
  format: (sum: number) => formatMoney(sum, "UZS"),
  currencyInfo: CURRENCY_INFO.UZS,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("UZS");
  const [rates] = useState<Record<CurrencyCode, number>>(DEFAULT_EXCHANGE_RATES);

  useEffect(() => {
    const saved = localStorage.getItem("safaar_currency") as CurrencyCode;
    if (saved && CURRENCY_INFO[saved]) {
      setTimeout(() => {
        setCurrencyState(saved);
      }, 0);
    }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    if (!CURRENCY_INFO[code]) return;
    setCurrencyState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("safaar_currency", code);
      document.cookie = `safaar_currency=${code}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const format = (amountInSum: number) => {
    return formatMoney(amountInSum, currency, rates);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rates,
        setCurrency,
        format,
        currencyInfo: CURRENCY_INFO[currency],
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
