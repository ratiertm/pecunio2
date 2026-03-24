"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { getStore } from "./store";
import { getDemoQuote } from "./market/demo-data";
import type { User, Portfolio, Holding, Trade, BiasScores, Quote } from "@/types";

interface AppState {
  user: User;
  portfolio: Portfolio;
  holdings: (Holding & { quote?: Quote })[];
  trades: Trade[];
  biasScores: BiasScores | null;
  tradeCount: number;
  refresh: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const store = getStore();
    const user = store.getUser();
    const portfolio = store.getPortfolio();
    const rawHoldings = store.getHoldings();
    const holdings = rawHoldings.map((h) => ({
      ...h,
      quote: getDemoQuote(h.ticker) ?? undefined,
    }));
    const trades = store.getTrades();
    const biasScores = store.getBiasScores();
    const tradeCount = store.getTradeCount();

    setState({ user, portfolio, holdings, trades, biasScores, tradeCount, refresh });
  }, [tick, refresh]);

  if (!state) return null; // SSR guard

  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
