import { describe, it, expect } from "vitest";
import { getDemoQuote, searchDemoTickers, getDemoHistory, getAllDemoQuotes } from "./demo-data";

describe("Demo Market Data", () => {
  describe("getDemoQuote", () => {
    it("returns quote for valid ticker", () => {
      const q = getDemoQuote("005930");
      expect(q).toBeTruthy();
      expect(q!.ticker).toBe("005930");
      expect(q!.market).toBe("KRX");
      expect(q!.price).toBeGreaterThan(0);
    });

    it("returns null for unknown ticker", () => {
      expect(getDemoQuote("XXXXXX")).toBeNull();
    });

    it("returns consistent price within same day", () => {
      const q1 = getDemoQuote("005930");
      const q2 = getDemoQuote("005930");
      expect(q1!.price).toBe(q2!.price);
    });

    it("includes change and volume data", () => {
      const q = getDemoQuote("005930");
      expect(q!.change_percent).toBeDefined();
      expect(q!.volume).toBeGreaterThan(0);
      expect(q!.is_stale).toBe(false);
    });
  });

  describe("searchDemoTickers", () => {
    it("finds by name (Korean)", () => {
      const results = searchDemoTickers("삼성");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name === "삼성전자")).toBe(true);
    });

    it("finds by ticker code", () => {
      const results = searchDemoTickers("005930");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("삼성전자");
    });

    it("returns empty for no match", () => {
      expect(searchDemoTickers("존재하지않는종목")).toEqual([]);
    });

    it("case insensitive search", () => {
      const results = searchDemoTickers("tiger");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("getDemoHistory", () => {
    it("returns 31 data points for 30 days", () => {
      const history = getDemoHistory("005930", 30);
      expect(history).toHaveLength(31); // 0 to 30 inclusive
    });

    it("returns empty for unknown ticker", () => {
      expect(getDemoHistory("XXXXXX")).toEqual([]);
    });

    it("all prices are positive", () => {
      const history = getDemoHistory("005930");
      history.forEach((d) => expect(d.price).toBeGreaterThan(0));
    });
  });

  describe("getAllDemoQuotes", () => {
    it("returns quotes for all demo stocks", () => {
      const quotes = getAllDemoQuotes();
      expect(quotes.size).toBeGreaterThan(10);
      expect(quotes.has("005930")).toBe(true);
    });
  });
});
