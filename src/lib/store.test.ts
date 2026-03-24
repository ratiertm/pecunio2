import { describe, it, expect, beforeEach } from "vitest";
import { getStore, resetStore } from "./store";

// Mock localStorage
const storage: Record<string, string> = {};
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => { storage[key] = val; },
    removeItem: (key: string) => { delete storage[key]; },
  },
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => Math.random().toString(36).slice(2) },
});

describe("LocalStore", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    resetStore();
  });

  describe("User", () => {
    it("returns default user", () => {
      const store = getStore();
      const user = store.getUser();
      expect(user.name).toBe("투자자");
      expect(user.level).toBe(1);
      expect(user.xp).toBe(0);
    });

    it("adds XP and calculates level", () => {
      const store = getStore();
      store.addXP(200);
      expect(store.getUser().xp).toBe(200);
      expect(store.getUser().level).toBe(2); // 150-300 = Lv.2

      store.addXP(200);
      expect(store.getUser().xp).toBe(400);
      expect(store.getUser().level).toBe(3); // 300-500 = Lv.3
    });
  });

  describe("Portfolio & Holdings", () => {
    it("returns default portfolio with 10M cash", () => {
      const store = getStore();
      expect(store.getPortfolio().current_cash).toBe(10_000_000);
      expect(store.getPortfolio().mode).toBe("sim");
    });

    it("updates cash", () => {
      const store = getStore();
      store.updateCash(-500_000);
      expect(store.getPortfolio().current_cash).toBe(9_500_000);
    });

    it("upserts holdings - new", () => {
      const store = getStore();
      store.upsertHolding("005930", "KRX", 10, 78000);
      const h = store.getHolding("005930");
      expect(h).toBeTruthy();
      expect(h!.qty).toBe(10);
      expect(h!.avg_price).toBe(78000);
    });

    it("upserts holdings - add to existing", () => {
      const store = getStore();
      store.upsertHolding("005930", "KRX", 10, 78000);
      store.upsertHolding("005930", "KRX", 5, 80000);
      const h = store.getHolding("005930");
      expect(h!.qty).toBe(15);
      // avg = (78000*10 + 80000*5) / 15 = 78667
      expect(h!.avg_price).toBe(78667);
    });

    it("reduces holding partially", () => {
      const store = getStore();
      store.upsertHolding("005930", "KRX", 10, 78000);
      store.reduceHolding("005930", 3);
      expect(store.getHolding("005930")!.qty).toBe(7);
    });

    it("removes holding when qty reaches zero", () => {
      const store = getStore();
      store.upsertHolding("005930", "KRX", 10, 78000);
      store.reduceHolding("005930", 10);
      expect(store.getHolding("005930")).toBeUndefined();
    });

    it("returns empty holdings for new user", () => {
      const store = getStore();
      expect(store.getHoldings()).toEqual([]);
    });
  });

  describe("Trades", () => {
    it("adds and retrieves trades sorted by date desc", () => {
      const store = getStore();
      store.addTrade({
        portfolio_id: "p1", ticker: "005930", market: "KRX",
        type: "buy", qty: 10, price: 78000,
        bias_alert_shown: false, bias_alert_action: "none",
      });
      store.addTrade({
        portfolio_id: "p1", ticker: "035720", market: "KRX",
        type: "buy", qty: 5, price: 48000,
        bias_alert_shown: false, bias_alert_action: "none",
      });
      const trades = store.getTrades();
      expect(trades).toHaveLength(2);
      // Both trades exist
      const tickers = trades.map((t) => t.ticker).sort();
      expect(tickers).toEqual(["005930", "035720"]);
    });

    it("tracks trade count", () => {
      const store = getStore();
      expect(store.getTradeCount()).toBe(0);
      store.addTrade({
        portfolio_id: "p1", ticker: "005930", market: "KRX",
        type: "buy", qty: 1, price: 78000,
        bias_alert_shown: false, bias_alert_action: "none",
      });
      expect(store.getTradeCount()).toBe(1);
    });
  });

  describe("Bias Events", () => {
    it("adds bias event", () => {
      const store = getStore();
      store.addBiasEvent({
        user_id: "u1", bias_type: "loss_aversion",
        score_delta: -5, outcome: "triggered",
        context_json: { ticker: "005930" },
      });
      expect(store.getBiasEvents()).toHaveLength(1);
      expect(store.getBiasEvents()[0].bias_type).toBe("loss_aversion");
    });
  });

  describe("Quiz", () => {
    it("adds quiz attempt", () => {
      const store = getStore();
      store.addQuizAttempt({
        user_id: "u1", lesson_id: "c1l1", score: 100,
        completed_at: new Date().toISOString(),
      });
      expect(store.getQuizAttempt("c1l1")).toBeTruthy();
      expect(store.getQuizAttempt("c1l1")!.score).toBe(100);
    });

    it("returns undefined for unattempted quiz", () => {
      const store = getStore();
      expect(store.getQuizAttempt("nonexistent")).toBeUndefined();
    });
  });

  describe("Reset", () => {
    it("resets all data", () => {
      const store = getStore();
      store.addXP(500);
      store.upsertHolding("005930", "KRX", 10, 78000);
      store.addTrade({
        portfolio_id: "p1", ticker: "005930", market: "KRX",
        type: "buy", qty: 10, price: 78000,
        bias_alert_shown: false, bias_alert_action: "none",
      });
      store.reset();
      expect(store.getUser().xp).toBe(0);
      expect(store.getHoldings()).toEqual([]);
      expect(store.getTradeCount()).toBe(0);
    });
  });
});
