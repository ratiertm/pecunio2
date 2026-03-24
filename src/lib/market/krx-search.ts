import tickers from "./krx-tickers.json";

interface KRXTicker {
  c: string; // code
  n: string; // name
  m: string; // market (KOSPI/KOSDAQ)
  p: number; // last price
}

const TICKERS = tickers as KRXTicker[];

// 별칭 매핑
const ALIASES: Record<string, string> = {
  "현대자동차": "현대차",
  "기아자동차": "기아",
  "엘지전자": "LG전자",
  "엘지화학": "LG화학",
  "엘지에너지솔루션": "LG에너지솔루션",
  "에스케이하이닉스": "SK하이닉스",
  "에스케이이노베이션": "SK이노베이션",
  "케이티": "KT",
  "케이티앤지": "KT&G",
  "포스코홀딩스": "POSCO홀딩스",
  "에쓰오일": "S-Oil",
};

export function searchKRXTickers(query: string, limit: number = 10) {
  if (!query || query.length < 1) return [];

  let q = query.toLowerCase().trim();

  // Apply aliases
  for (const [alias, real] of Object.entries(ALIASES)) {
    if (q.includes(alias.toLowerCase())) {
      q = q.replace(alias.toLowerCase(), real.toLowerCase());
    }
  }

  const isCode = /^\d+$/.test(q);

  const results = TICKERS.filter((t) => {
    if (isCode) return t.c.includes(q);
    return t.n.toLowerCase().includes(q);
  }).slice(0, limit);

  return results.map((t) => ({
    ticker: t.c,
    name: t.n,
    market: "KRX" as const,
    price: t.p,
    marketCategory: t.m,
  }));
}

export function getTickerName(code: string): string | null {
  const found = TICKERS.find((t) => t.c === code);
  return found?.n ?? null;
}

export function getTickerCount(): number {
  return TICKERS.length;
}
