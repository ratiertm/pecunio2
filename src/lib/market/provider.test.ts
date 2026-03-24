import { describe, it, expect, beforeEach } from "vitest";
import { CachedMarketData, type MarketDataProvider } from "./provider";
import type { Quote, TickerSearchResult } from "@/types";

// Mock provider
class MockKRXProvider implements MarketDataProvider {
  market = "KRX" as const;
  callCount = 0;
  shouldFail = false;

  async getQuote(ticker: string): Promise<Quote | null> {
    this.callCount++;
    if (this.shouldFail) throw new Error("API down");
    return {
      ticker, market: "KRX", price: 78500, change: 1200,
      change_percent: 1.55, volume: 1000000,
      timestamp: new Date().toISOString(), is_stale: false,
    };
  }

  async getQuotes(tickers: string[]): Promise<Map<string, Quote>> {
    const map = new Map<string, Quote>();
    for (const t of tickers) {
      const q = await this.getQuote(t);
      if (q) map.set(t, q);
    }
    return map;
  }

  async searchTickers(query: string): Promise<TickerSearchResult[]> {
    if (query === "삼성") return [{ ticker: "005930", name: "삼성전자", market: "KRX" }];
    return [];
  }
}

describe("CachedMarketData", () => {
  let cache: CachedMarketData;
  let provider: MockKRXProvider;

  beforeEach(() => {
    cache = new CachedMarketData();
    provider = new MockKRXProvider();
    cache.registerProvider(provider);
  });

  it("fetches quote from provider on cache miss", async () => {
    const q = await cache.getQuote("005930", "KRX");
    expect(q).toBeTruthy();
    expect(q!.price).toBe(78500);
    expect(provider.callCount).toBe(1);
  });

  it("returns cached quote on second call", async () => {
    await cache.getQuote("005930", "KRX");
    await cache.getQuote("005930", "KRX");
    expect(provider.callCount).toBe(1); // only 1 API call
  });

  it("returns null for unregistered market", async () => {
    const q = await cache.getQuote("AAPL", "US");
    expect(q).toBeNull();
  });

  it("returns stale cache on API error", async () => {
    // First call succeeds
    await cache.getQuote("005930", "KRX");
    // Force cache expiry by manipulating internal state
    const cacheMap = (cache as any).cache;
    const entry = cacheMap.get("KRX:005930");
    entry.cachedAt = 0; // expired
    // Make provider fail
    provider.shouldFail = true;
    const q = await cache.getQuote("005930", "KRX");
    expect(q).toBeTruthy();
    expect(q!.is_stale).toBe(true);
  });

  it("batch fetches multiple tickers", async () => {
    const results = await cache.getQuotes([
      { ticker: "005930", market: "KRX" as const },
      { ticker: "035720", market: "KRX" as const },
    ]);
    expect(results.size).toBe(2);
  });

  it("uses cache for batch fetches", async () => {
    await cache.getQuote("005930", "KRX"); // pre-cache
    provider.callCount = 0;
    await cache.getQuotes([
      { ticker: "005930", market: "KRX" as const },
      { ticker: "035720", market: "KRX" as const },
    ]);
    expect(provider.callCount).toBe(1); // only 035720 fetched
  });

  it("searches tickers", async () => {
    const results = await cache.searchTickers("삼성");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("삼성전자");
  });

  it("sanitizes search query", async () => {
    const results = await cache.searchTickers("<script>alert(1)</script>");
    expect(results).toEqual([]);
  });

  it("returns empty for blank search", async () => {
    const results = await cache.searchTickers("");
    expect(results).toEqual([]);
  });
});
