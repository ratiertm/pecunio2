import type { Quote, Market, TickerSearchResult } from "@/types";

// ===========================
// Market Data Provider
// ===========================
//
//   MarketDataProvider (interface)
//       │
//       ├── KRXProvider   (공공데이터포털 API)
//       └── USProvider     (Finnhub — Phase 2)
//
//   CachedMarketData wraps any provider with
//   5-min TTL in-memory cache + batch fetching
// ===========================

export interface MarketDataProvider {
  getQuote(ticker: string): Promise<Quote | null>;
  getQuotes(tickers: string[]): Promise<Map<string, Quote>>;
  searchTickers(query: string): Promise<TickerSearchResult[]>;
  market: Market;
}

interface CacheEntry {
  quote: Quote;
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class CachedMarketData {
  private cache = new Map<string, CacheEntry>();
  private providers = new Map<Market, MarketDataProvider>();

  registerProvider(provider: MarketDataProvider) {
    this.providers.set(provider.market, provider);
  }

  async getQuote(ticker: string, market: Market): Promise<Quote | null> {
    const key = `${market}:${ticker}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.quote;
    }

    const provider = this.providers.get(market);
    if (!provider) return null;

    try {
      const quote = await provider.getQuote(ticker);
      if (quote) {
        this.cache.set(key, { quote, cachedAt: Date.now() });
      }
      return quote;
    } catch {
      // Fallback to stale cache on API error
      if (cached) {
        return { ...cached.quote, is_stale: true };
      }
      return null;
    }
  }

  async getQuotes(
    tickers: { ticker: string; market: Market }[]
  ): Promise<Map<string, Quote>> {
    const results = new Map<string, Quote>();
    const misses: { ticker: string; market: Market }[] = [];

    // Check cache first
    for (const { ticker, market } of tickers) {
      const key = `${market}:${ticker}`;
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        results.set(key, cached.quote);
      } else {
        misses.push({ ticker, market });
      }
    }

    // Batch fetch misses per provider
    const byMarket = new Map<Market, string[]>();
    for (const { ticker, market } of misses) {
      const list = byMarket.get(market) || [];
      list.push(ticker);
      byMarket.set(market, list);
    }

    await Promise.all(
      Array.from(byMarket.entries()).map(async ([market, tickerList]) => {
        const provider = this.providers.get(market);
        if (!provider) return;

        try {
          const quotes = await provider.getQuotes(tickerList);
          for (const [ticker, quote] of quotes) {
            const key = `${market}:${ticker}`;
            this.cache.set(key, { quote, cachedAt: Date.now() });
            results.set(key, quote);
          }
        } catch {
          // Use stale cache for failed batch
          for (const ticker of tickerList) {
            const key = `${market}:${ticker}`;
            const cached = this.cache.get(key);
            if (cached) {
              results.set(key, { ...cached.quote, is_stale: true });
            }
          }
        }
      })
    );

    return results;
  }

  async searchTickers(
    query: string,
    market?: Market
  ): Promise<TickerSearchResult[]> {
    const sanitized = query.replace(/[^\w\sㄱ-ㅎ가-힣]/g, "").trim();
    if (!sanitized) return [];

    const providers = market
      ? [this.providers.get(market)].filter(Boolean)
      : Array.from(this.providers.values());

    const results = await Promise.all(
      providers.map((p) => p!.searchTickers(sanitized))
    );

    return results.flat();
  }
}

// Singleton
export const marketData = new CachedMarketData();
