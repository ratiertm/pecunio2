import { NextRequest, NextResponse } from "next/server";

const KRX_API_URL = "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService";
const KRX_API_KEY = process.env.KRX_API_KEY || "";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  try {
    const url = new URL(`${KRX_API_URL}/getStockPriceInfo`);
    url.searchParams.set("serviceKey", KRX_API_KEY);
    url.searchParams.set("resultType", "json");
    url.searchParams.set("numOfRows", "1");
    url.searchParams.set("likeSrtnCd", ticker);

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // 5min server-side cache
    });
    if (!res.ok) throw new Error(`KRX API ${res.status}`);

    const data = await res.json();
    const items = data?.response?.body?.items?.item || [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const item = items[0];
    return NextResponse.json({
      quote: {
        ticker: item.srtnCd,
        name: item.itmsNm,
        market: "KRX",
        marketCategory: item.mrktCtg,
        price: Number(item.clpr),
        change: Number(item.vs),
        change_percent: Number(item.fltRt),
        volume: Number(item.trqu),
        trade_amount: Number(item.trPrc),
        high: Number(item.hipr),
        low: Number(item.lopr),
        open: Number(item.mkp),
        listed_shares: Number(item.lstgStCnt),
        market_cap: Number(item.mrktTotAmt),
        timestamp: item.basDt,
        is_stale: false,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
