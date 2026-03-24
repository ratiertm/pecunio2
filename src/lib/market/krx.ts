import type { Quote, TickerSearchResult } from "@/types";
import type { MarketDataProvider } from "./provider";

// 공공데이터포털 금융위원회 주식시세 API
// https://www.data.go.kr/data/15094808/openapi.do

const KRX_API_URL = "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService";
const KRX_API_KEY = process.env.KRX_API_KEY || "";

interface KRXStockItem {
  srtnCd: string;    // 종목코드 (단축)
  itmsNm: string;    // 종목명
  mrktCtg: string;   // 시장구분 (KOSPI/KOSDAQ)
  clpr: string;      // 종가
  vs: string;        // 전일대비
  fltRt: string;     // 등락률
  trqu: string;      // 거래량
  basDt: string;     // 기준일자
}

export class KRXProvider implements MarketDataProvider {
  market = "KRX" as const;

  async getQuote(ticker: string): Promise<Quote | null> {
    const quotes = await this.getQuotes([ticker]);
    return quotes.get(ticker) || null;
  }

  async getQuotes(tickers: string[]): Promise<Map<string, Quote>> {
    const results = new Map<string, Quote>();

    // 공공데이터포털 API는 종목별 개별 조회
    // 배치를 위해 Promise.all 사용 (rate limit 주의)
    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const url = new URL(`${KRX_API_URL}/getStockPriceInfo`);
          url.searchParams.set("serviceKey", KRX_API_KEY);
          url.searchParams.set("resultType", "json");
          url.searchParams.set("numOfRows", "1");
          url.searchParams.set("likeSrtnCd", ticker);

          const res = await fetch(url.toString(), {
            next: { revalidate: 300 }, // 5min cache at fetch level
          });

          if (!res.ok) throw new Error(`KRX API ${res.status}`);

          const data = await res.json();
          const items: KRXStockItem[] =
            data?.response?.body?.items?.item || [];

          if (items.length > 0) {
            const item = items[0];
            results.set(ticker, {
              ticker: item.srtnCd,
              market: "KRX",
              price: Number(item.clpr),
              change: Number(item.vs),
              change_percent: Number(item.fltRt),
              volume: Number(item.trqu),
              timestamp: item.basDt,
              is_stale: false,
            });
          }
        } catch {
          // Individual ticker failure doesn't block others
        }
      })
    );

    return results;
  }

  async searchTickers(query: string): Promise<TickerSearchResult[]> {
    try {
      const url = new URL(`${KRX_API_URL}/getStockPriceInfo`);
      url.searchParams.set("serviceKey", KRX_API_KEY);
      url.searchParams.set("resultType", "json");
      url.searchParams.set("numOfRows", "10");
      url.searchParams.set("likeItmsNm", query);

      const res = await fetch(url.toString());
      if (!res.ok) return [];

      const data = await res.json();
      const items: KRXStockItem[] =
        data?.response?.body?.items?.item || [];

      return items.map((item) => ({
        ticker: item.srtnCd,
        name: item.itmsNm,
        market: "KRX" as const,
      }));
    } catch {
      return [];
    }
  }
}
