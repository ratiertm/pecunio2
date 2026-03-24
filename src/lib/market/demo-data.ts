import type { Quote, TickerSearchResult } from "@/types";

// 실제 API 연동 전 데모 시세 데이터
// 가격은 실제와 유사한 수준으로 설정

interface DemoStock {
  ticker: string;
  name: string;
  market: "KRX" | "US";
  basePrice: number;
  volatility: number; // daily % swing
}

const DEMO_STOCKS: DemoStock[] = [
  // KRX
  { ticker: "005930", name: "삼성전자", market: "KRX", basePrice: 78500, volatility: 2 },
  { ticker: "000660", name: "SK하이닉스", market: "KRX", basePrice: 185000, volatility: 3 },
  { ticker: "035720", name: "카카오", market: "KRX", basePrice: 48900, volatility: 2.5 },
  { ticker: "035420", name: "NAVER", market: "KRX", basePrice: 195000, volatility: 2 },
  { ticker: "373220", name: "LG에너지솔루션", market: "KRX", basePrice: 380000, volatility: 2.5 },
  { ticker: "068270", name: "셀트리온", market: "KRX", basePrice: 178000, volatility: 2 },
  { ticker: "105560", name: "KB금융", market: "KRX", basePrice: 82000, volatility: 1.5 },
  { ticker: "055550", name: "신한지주", market: "KRX", basePrice: 52000, volatility: 1.5 },
  { ticker: "360750", name: "TIGER S&P500", market: "KRX", basePrice: 18500, volatility: 1 },
  { ticker: "069500", name: "KODEX 200", market: "KRX", basePrice: 35200, volatility: 1 },
  { ticker: "005380", name: "현대차", market: "KRX", basePrice: 245000, volatility: 2 },
  { ticker: "051910", name: "LG화학", market: "KRX", basePrice: 310000, volatility: 2.5 },
  { ticker: "006400", name: "삼성SDI", market: "KRX", basePrice: 395000, volatility: 2.5 },
  { ticker: "003670", name: "포스코퓨처엠", market: "KRX", basePrice: 215000, volatility: 3 },
  { ticker: "028260", name: "삼성물산", market: "KRX", basePrice: 142000, volatility: 1.5 },
];

// 하루 내에서 일관된 가격을 위해 날짜 기반 시드
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getTodaySeed(ticker: string): number {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = ticker + today;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function getDemoQuote(ticker: string): Quote | null {
  const stock = DEMO_STOCKS.find((s) => s.ticker === ticker);
  if (!stock) return null;

  const seed = getTodaySeed(ticker);
  const rand = seededRandom(seed);
  const changePercent = (rand - 0.5) * 2 * stock.volatility;
  const change = Math.round(stock.basePrice * (changePercent / 100));
  const price = stock.basePrice + change;

  return {
    ticker: stock.ticker,
    market: stock.market,
    price,
    change,
    change_percent: Math.round(changePercent * 100) / 100,
    volume: Math.round(1000000 + rand * 5000000),
    timestamp: new Date().toISOString(),
    is_stale: false,
  };
}

export function searchDemoTickers(query: string): TickerSearchResult[] {
  const q = query.toLowerCase();
  return DEMO_STOCKS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.ticker.toLowerCase().includes(q)
  ).map((s) => ({
    ticker: s.ticker,
    name: s.name,
    market: s.market,
  }));
}

export function getAllDemoQuotes(): Map<string, Quote> {
  const map = new Map<string, Quote>();
  for (const stock of DEMO_STOCKS) {
    const quote = getDemoQuote(stock.ticker);
    if (quote) map.set(stock.ticker, quote);
  }
  return map;
}

// 차트용 과거 30일 가격 데이터 생성
export function getDemoHistory(ticker: string, days: number = 30): { date: string; price: number }[] {
  const stock = DEMO_STOCKS.find((s) => s.ticker === ticker);
  if (!stock) return [];

  const result: { date: string; price: number }[] = [];
  let price = stock.basePrice * 0.95; // 30일 전에는 좀 더 낮았다고 가정

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

    const seed = getTodaySeed(ticker + i.toString());
    const rand = seededRandom(seed);
    const dailyChange = (rand - 0.48) * stock.volatility * 0.01; // slight upward bias
    price = price * (1 + dailyChange);

    result.push({ date: dateStr, price: Math.round(price) });
  }

  return result;
}
