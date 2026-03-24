import { NextRequest, NextResponse } from "next/server";

const KRX_API_URL = "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService";
const KRX_API_KEY = process.env.KRX_API_KEY || "";

// 공공데이터포털 종목명과 일반적으로 사용하는 이름이 다른 경우 매핑
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

function resolveQuery(q: string): string[] {
  const queries = [q];

  // Check aliases
  for (const [alias, real] of Object.entries(ALIASES)) {
    if (q.includes(alias)) {
      queries.push(q.replace(alias, real));
    }
  }

  // Also try without spaces
  const noSpace = q.replace(/\s/g, "");
  if (noSpace !== q) queries.push(noSpace);

  return [...new Set(queries)];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const isCode = /^\d+$/.test(q);
  const queries = isCode ? [q] : resolveQuery(q);

  try {
    const allResults: any[] = [];
    const seen = new Set<string>();

    // Search with all query variants
    for (const query of queries) {
      const param = isCode ? "likeSrtnCd" : "likeItmsNm";
      const url = new URL(`${KRX_API_URL}/getStockPriceInfo`);
      url.searchParams.set("serviceKey", KRX_API_KEY);
      url.searchParams.set("resultType", "json");
      url.searchParams.set("numOfRows", "10");
      url.searchParams.set(param, query);

      const res = await fetch(url.toString());
      if (!res.ok) continue;

      const data = await res.json();
      const items = data?.response?.body?.items?.item || [];

      for (const item of items) {
        if (seen.has(item.srtnCd)) continue;
        seen.add(item.srtnCd);
        allResults.push({
          ticker: item.srtnCd,
          name: item.itmsNm,
          market: "KRX",
          price: Number(item.clpr),
          change: Number(item.vs),
          change_percent: Number(item.fltRt),
        });
      }
    }

    return NextResponse.json({ results: allResults });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
