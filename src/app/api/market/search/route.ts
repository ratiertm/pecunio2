import { NextRequest, NextResponse } from "next/server";

const KRX_API_URL = "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService";
const KRX_API_KEY = process.env.KRX_API_KEY || "";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  // Determine if query is a ticker code or name
  const isCode = /^\d+$/.test(q);
  const param = isCode ? "likeSrtnCd" : "likeItmsNm";

  try {
    const url = new URL(`${KRX_API_URL}/getStockPriceInfo`);
    url.searchParams.set("serviceKey", KRX_API_KEY);
    url.searchParams.set("resultType", "json");
    url.searchParams.set("numOfRows", "10");
    url.searchParams.set(param, q);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`KRX API ${res.status}`);

    const data = await res.json();
    const items = data?.response?.body?.items?.item || [];

    // Deduplicate by ticker (API returns multiple dates)
    const seen = new Set<string>();
    const results = [];
    for (const item of items) {
      if (seen.has(item.srtnCd)) continue;
      seen.add(item.srtnCd);
      results.push({
        ticker: item.srtnCd,
        name: item.itmsNm,
        market: "KRX",
        price: Number(item.clpr),
        change: Number(item.vs),
        change_percent: Number(item.fltRt),
      });
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
