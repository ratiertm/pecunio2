// ===========================
// Local Data Store
// ===========================
// Supabase 연동 전까지 localStorage + in-memory로 동작
// 모든 CRUD를 여기서 처리, 나중에 Supabase로 교체

import type {
  Portfolio,
  Holding,
  Trade,
  BiasEvent,
  BiasScores,
  Lesson,
  QuizQuestion,
  QuizAttempt,
  User,
  Market,
} from "@/types";

const STORAGE_KEY = "pecunio2_data";

interface StoreData {
  user: User;
  portfolio: Portfolio;
  holdings: Holding[];
  trades: Trade[];
  biasEvents: BiasEvent[];
  biasScores: BiasScores | null;
  quizAttempts: QuizAttempt[];
}

function defaultData(): StoreData {
  return {
    user: {
      id: "local-user",
      name: "투자자",
      email: "user@pecunio2.local",
      level: 1,
      xp: 0,
      created_at: new Date().toISOString(),
    },
    portfolio: {
      id: "local-portfolio",
      user_id: "local-user",
      name: "기본 포트폴리오",
      mode: "sim",
      initial_cash: 10_000_000,
      current_cash: 10_000_000,
    },
    holdings: [],
    trades: [],
    biasEvents: [],
    biasScores: null,
    quizAttempts: [],
  };
}

class LocalStore {
  private data: StoreData;

  constructor() {
    this.data = defaultData();
    if (typeof window !== "undefined") {
      this.load();
    }
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.data = { ...defaultData(), ...JSON.parse(saved) };
      }
    } catch {
      this.data = defaultData();
    }
  }

  private save() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }

  // --- User ---
  getUser(): User {
    return this.data.user;
  }

  addXP(amount: number): User {
    this.data.user.xp += amount;
    // Recalculate level
    const levels = [0, 150, 300, 500, 750, 1000, 1500, 2000, 2500, 3500];
    let newLevel = 1;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (this.data.user.xp >= levels[i]) {
        newLevel = i + 1;
        break;
      }
    }
    this.data.user.level = newLevel;
    this.save();
    return this.data.user;
  }

  // --- Portfolio ---
  getPortfolio(): Portfolio {
    return this.data.portfolio;
  }

  updateCash(delta: number) {
    this.data.portfolio.current_cash += delta;
    this.save();
  }

  // --- Holdings ---
  getHoldings(): Holding[] {
    return this.data.holdings;
  }

  getHolding(ticker: string): Holding | undefined {
    return this.data.holdings.find((h) => h.ticker === ticker);
  }

  upsertHolding(ticker: string, market: Market, qty: number, price: number) {
    const existing = this.data.holdings.find((h) => h.ticker === ticker);
    if (existing) {
      const newQty = existing.qty + qty;
      const newAvg =
        (existing.avg_price * existing.qty + price * qty) / newQty;
      existing.qty = newQty;
      existing.avg_price = Math.round(newAvg);
    } else {
      this.data.holdings.push({
        id: crypto.randomUUID(),
        portfolio_id: this.data.portfolio.id,
        ticker,
        market,
        qty,
        avg_price: price,
      });
    }
    this.save();
  }

  reduceHolding(ticker: string, qty: number) {
    const idx = this.data.holdings.findIndex((h) => h.ticker === ticker);
    if (idx === -1) return;
    if (this.data.holdings[idx].qty <= qty) {
      this.data.holdings.splice(idx, 1);
    } else {
      this.data.holdings[idx].qty -= qty;
    }
    this.save();
  }

  // --- Trades ---
  getTrades(): Trade[] {
    return [...this.data.trades].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getTradeCount(): number {
    return this.data.trades.length;
  }

  addTrade(trade: Omit<Trade, "id" | "created_at">): Trade {
    const newTrade: Trade = {
      ...trade,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.data.trades.push(newTrade);
    this.save();
    return newTrade;
  }

  // --- Bias Events ---
  getBiasEvents(): BiasEvent[] {
    return this.data.biasEvents;
  }

  addBiasEvent(event: Omit<BiasEvent, "id">): BiasEvent {
    const newEvent: BiasEvent = { ...event, id: crypto.randomUUID() };
    this.data.biasEvents.push(newEvent);
    this.save();
    return newEvent;
  }

  // --- Bias Scores ---
  getBiasScores(): BiasScores | null {
    return this.data.biasScores;
  }

  setBiasScores(scores: Omit<BiasScores, "id">) {
    this.data.biasScores = { ...scores, id: "local-scores" };
    this.save();
  }

  // --- Quiz ---
  getQuizAttempts(): QuizAttempt[] {
    return this.data.quizAttempts;
  }

  getQuizAttempt(lessonId: string): QuizAttempt | undefined {
    return this.data.quizAttempts.find((a) => a.lesson_id === lessonId);
  }

  addQuizAttempt(attempt: Omit<QuizAttempt, "id">): QuizAttempt {
    const newAttempt: QuizAttempt = { ...attempt, id: crypto.randomUUID() };
    this.data.quizAttempts.push(newAttempt);
    this.save();
    return newAttempt;
  }

  // --- Reset ---
  reset() {
    this.data = defaultData();
    this.save();
  }
}

// Singleton
let _store: LocalStore | null = null;
export function getStore(): LocalStore {
  if (!_store) _store = new LocalStore();
  return _store;
}

// For testing only
export function resetStore(): void {
  _store = null;
}
